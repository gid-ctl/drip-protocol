;; DRIP Protocol - sBTC & STX Streaming Payments
;; Bitcoin that flows. Stacks that stream.
;; Built with Clarity 4 (SIP-033) for BUIDL BATTLE #2
;;
;; Features:
;;   - Linear vesting sBTC + STX streams
;;   - Emergency pause mechanism
;;   - Self-stream prevention
;;   - Protocol-wide statistics
;;   - Escrow-based security via as-contract

;; ============================================
;; Constants
;; ============================================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-STREAM-NOT-FOUND (err u101))
(define-constant ERR-STREAM-DEPLETED (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-INVALID-DURATION (err u104))
(define-constant ERR-NOT-RECIPIENT (err u105))
(define-constant ERR-NOT-SENDER (err u106))
(define-constant ERR-STREAM-NOT-ACTIVE (err u107))
(define-constant ERR-TRANSFER-FAILED (err u108))
(define-constant ERR-STX-TRANSFER-FAILED (err u109))
(define-constant ERR-PROTOCOL-PAUSED (err u110))
(define-constant ERR-SELF-STREAM (err u111))

;; ============================================
;; Protocol State
;; ============================================

;; Emergency pause flag
(define-data-var protocol-paused bool false)

;; Stream counters
(define-data-var stream-nonce uint u0)
(define-data-var stx-stream-nonce uint u0)

;; Protocol-wide stats
(define-data-var total-sbtc-streamed uint u0)
(define-data-var total-stx-streamed uint u0)
(define-data-var total-streams-created uint u0)

;; ============================================
;; Data Maps
;; ============================================

;; sBTC stream data
(define-map streams
  uint
  {
    sender: principal,
    recipient: principal,
    total-amount: uint,
    withdrawn: uint,
    start-block: uint,
    end-block: uint,
    active: bool
  }
)

;; STX stream data
(define-map stx-streams
  uint
  {
    sender: principal,
    recipient: principal,
    total-amount: uint,
    withdrawn: uint,
    start-block: uint,
    end-block: uint,
    active: bool
  }
)

;; User stream indexes (sBTC)
(define-map sender-streams principal (list 50 uint))
(define-map recipient-streams principal (list 50 uint))

;; User stream indexes (STX)
(define-map stx-sender-streams principal (list 50 uint))
(define-map stx-recipient-streams principal (list 50 uint))

;; ============================================
;; Private Functions
;; ============================================

;; Linear vesting: calculates how much has unlocked at current block
(define-private (calculate-vested-amount (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) u0))
    (total (get total-amount stream))
    (start (get start-block stream))
    (end (get end-block stream))
    (current stacks-block-height)
  )
    (if (<= current start)
      u0
      (if (>= current end)
        total
        (/ (* total (- current start)) (- end start))
      )
    )
  )
)

;; Linear vesting for STX streams
(define-private (calculate-stx-vested-amount (stream-id uint))
  (let (
    (stream (unwrap! (map-get? stx-streams stream-id) u0))
    (total (get total-amount stream))
    (start (get start-block stream))
    (end (get end-block stream))
    (current stacks-block-height)
  )
    (if (<= current start)
      u0
      (if (>= current end)
        total
        (/ (* total (- current start)) (- end start))
      )
    )
  )
)

;; Append stream ID to a list
(define-private (add-to-list (stream-id uint) (current-list (list 50 uint)))
  (unwrap! (as-max-len? (append current-list stream-id) u50) current-list)
)

;; Get contract's own principal for use as escrow
(define-private (get-contract-principal)
  current-contract
)

;; Transfer sBTC from contract escrow to a recipient
(define-private (transfer-sbtc-from-escrow (amount uint) (to principal))
  (as-contract? ((with-ft .sbtc-token "sbtc" amount))
    (try! (contract-call? .sbtc-token transfer amount tx-sender to none))
  )
)

;; ============================================
;; Admin Functions
;; ============================================

;; Emergency pause - halt new stream creation
(define-public (set-protocol-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused paused)
    (ok paused)
  )
)

;; ============================================
;; sBTC Stream Functions
;; ============================================

;; Create a new sBTC streaming payment
(define-public (create-stream 
    (recipient principal) 
    (total-amount uint) 
    (duration-blocks uint)
  )
  (let (
    (stream-id (var-get stream-nonce))
    (start-block stacks-block-height)
    (end-block (+ stacks-block-height duration-blocks))
    (sender tx-sender)
  )
    ;; Protocol must not be paused
    (asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
    ;; Validate inputs
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration-blocks u0) ERR-INVALID-DURATION)
    ;; Cannot stream to self
    (asserts! (not (is-eq sender recipient)) ERR-SELF-STREAM)

    ;; Transfer sBTC from sender to contract escrow (Clarity 4: restrict-assets? enforces exact amount)
    (try! (restrict-assets? tx-sender
      ((with-ft .sbtc-token "sbtc" total-amount))
      (try! (contract-call? .sbtc-token transfer total-amount sender (get-contract-principal) none))
    ))

    ;; Store stream
    (map-set streams stream-id {
      sender: sender,
      recipient: recipient,
      total-amount: total-amount,
      withdrawn: u0,
      start-block: start-block,
      end-block: end-block,
      active: true
    })

    ;; Update indexes
    (map-set sender-streams sender 
      (add-to-list stream-id (default-to (list) (map-get? sender-streams sender))))
    (map-set recipient-streams recipient 
      (add-to-list stream-id (default-to (list) (map-get? recipient-streams recipient))))

    ;; Update protocol stats
    (var-set stream-nonce (+ stream-id u1))
    (var-set total-sbtc-streamed (+ (var-get total-sbtc-streamed) total-amount))
    (var-set total-streams-created (+ (var-get total-streams-created) u1))

    (ok stream-id)
  )
)

;; Withdraw vested sBTC from a stream
(define-public (withdraw (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (recipient (get recipient stream))
    (withdrawn (get withdrawn stream))
    (vested (calculate-vested-amount stream-id))
    (available (- vested withdrawn))
  )
    (asserts! (is-eq tx-sender recipient) ERR-NOT-RECIPIENT)
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)
    (asserts! (> available u0) ERR-STREAM-DEPLETED)

    ;; Transfer from escrow
    (try! (transfer-sbtc-from-escrow available recipient))

    ;; Update withdrawn
    (map-set streams stream-id (merge stream { withdrawn: vested }))

    (ok available)
  )
)

;; Cancel stream - sender reclaims unvested, recipient gets vested
(define-public (cancel-stream (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (sender (get sender stream))
    (recipient (get recipient stream))
    (total (get total-amount stream))
    (withdrawn (get withdrawn stream))
    (vested (calculate-vested-amount stream-id))
    (recipient-amount (- vested withdrawn))
    (sender-refund (- total vested))
  )
    (asserts! (is-eq tx-sender sender) ERR-NOT-SENDER)
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)

    ;; Pay out vested to recipient
    (if (> recipient-amount u0)
      (try! (transfer-sbtc-from-escrow recipient-amount recipient))
      true
    )
    ;; Refund unvested to sender
    (if (> sender-refund u0)
      (try! (transfer-sbtc-from-escrow sender-refund sender))
      true
    )

    ;; Mark inactive
    (map-set streams stream-id (merge stream { 
      active: false,
      withdrawn: vested
    }))

    (ok { recipient-received: recipient-amount, sender-refunded: sender-refund })
  )
)

;; ============================================
;; STX Stream Functions
;; ============================================

;; Create a new STX streaming payment
(define-public (create-stx-stream 
    (recipient principal) 
    (total-amount uint) 
    (duration-blocks uint)
  )
  (let (
    (stream-id (var-get stx-stream-nonce))
    (start-block stacks-block-height)
    (end-block (+ stacks-block-height duration-blocks))
    (sender tx-sender)
  )
    (asserts! (not (var-get protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration-blocks u0) ERR-INVALID-DURATION)
    (asserts! (not (is-eq sender recipient)) ERR-SELF-STREAM)

    ;; Transfer STX to contract escrow (Clarity 4: restrict-assets? enforces exact amount)
    (try! (restrict-assets? tx-sender
      ((with-stx total-amount))
      (try! (stx-transfer? total-amount sender current-contract))
    ))

    ;; Store stream
    (map-set stx-streams stream-id {
      sender: sender,
      recipient: recipient,
      total-amount: total-amount,
      withdrawn: u0,
      start-block: start-block,
      end-block: end-block,
      active: true
    })

    ;; Update indexes
    (map-set stx-sender-streams sender 
      (add-to-list stream-id (default-to (list) (map-get? stx-sender-streams sender))))
    (map-set stx-recipient-streams recipient 
      (add-to-list stream-id (default-to (list) (map-get? stx-recipient-streams recipient))))

    ;; Update stats
    (var-set stx-stream-nonce (+ stream-id u1))
    (var-set total-stx-streamed (+ (var-get total-stx-streamed) total-amount))
    (var-set total-streams-created (+ (var-get total-streams-created) u1))

    (ok stream-id)
  )
)

;; Withdraw vested STX from a stream
(define-public (withdraw-stx (stream-id uint))
  (let (
    (stream (unwrap! (map-get? stx-streams stream-id) ERR-STREAM-NOT-FOUND))
    (recipient (get recipient stream))
    (withdrawn (get withdrawn stream))
    (vested (calculate-stx-vested-amount stream-id))
    (available (- vested withdrawn))
  )
    (asserts! (is-eq tx-sender recipient) ERR-NOT-RECIPIENT)
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)
    (asserts! (> available u0) ERR-STREAM-DEPLETED)

    ;; Transfer STX from escrow
    (try! (as-contract? ((with-stx available))
      (try! (stx-transfer? available tx-sender recipient))
    ))

    ;; Update withdrawn
    (map-set stx-streams stream-id (merge stream { withdrawn: vested }))

    (ok available)
  )
)

;; Cancel STX stream
(define-public (cancel-stx-stream (stream-id uint))
  (let (
    (stream (unwrap! (map-get? stx-streams stream-id) ERR-STREAM-NOT-FOUND))
    (sender (get sender stream))
    (recipient (get recipient stream))
    (total (get total-amount stream))
    (withdrawn (get withdrawn stream))
    (vested (calculate-stx-vested-amount stream-id))
    (recipient-amount (- vested withdrawn))
    (sender-refund (- total vested))
  )
    (asserts! (is-eq tx-sender sender) ERR-NOT-SENDER)
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)

    (if (> recipient-amount u0)
      (try! (as-contract? ((with-stx recipient-amount))
        (try! (stx-transfer? recipient-amount tx-sender recipient))
      ))
      true
    )
    (if (> sender-refund u0)
      (try! (as-contract? ((with-stx sender-refund))
        (try! (stx-transfer? sender-refund tx-sender sender))
      ))
      true
    )

    (map-set stx-streams stream-id (merge stream { 
      active: false,
      withdrawn: vested
    }))

    (ok { recipient-received: recipient-amount, sender-refunded: sender-refund })
  )
)

;; ============================================
;; Read-Only Functions - sBTC Streams
;; ============================================

(define-read-only (get-stream (stream-id uint))
  (map-get? streams stream-id)
)

(define-read-only (get-withdrawable (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) (ok u0)))
    (vested (calculate-vested-amount stream-id))
    (withdrawn (get withdrawn stream))
  )
    (ok (- vested withdrawn))
  )
)

(define-read-only (get-vested (stream-id uint))
  (ok (calculate-vested-amount stream-id))
)

(define-read-only (get-stream-progress (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) (ok u0)))
    (total (get total-amount stream))
    (vested (calculate-vested-amount stream-id))
  )
    (if (is-eq total u0)
      (ok u0)
      (ok (/ (* vested u100) total))
    )
  )
)

(define-read-only (get-outgoing-streams (user principal))
  (default-to (list) (map-get? sender-streams user))
)

(define-read-only (get-incoming-streams (user principal))
  (default-to (list) (map-get? recipient-streams user))
)

(define-read-only (get-stream-count)
  (var-get stream-nonce)
)

;; ============================================
;; Read-Only Functions - STX Streams
;; ============================================

(define-read-only (get-stx-stream (stream-id uint))
  (map-get? stx-streams stream-id)
)

(define-read-only (get-stx-withdrawable (stream-id uint))
  (let (
    (stream (unwrap! (map-get? stx-streams stream-id) (ok u0)))
    (vested (calculate-stx-vested-amount stream-id))
    (withdrawn (get withdrawn stream))
  )
    (ok (- vested withdrawn))
  )
)

(define-read-only (get-stx-vested (stream-id uint))
  (ok (calculate-stx-vested-amount stream-id))
)

(define-read-only (get-stx-stream-progress (stream-id uint))
  (let (
    (stream (unwrap! (map-get? stx-streams stream-id) (ok u0)))
    (total (get total-amount stream))
    (vested (calculate-stx-vested-amount stream-id))
  )
    (if (is-eq total u0)
      (ok u0)
      (ok (/ (* vested u100) total))
    )
  )
)

(define-read-only (get-stx-outgoing-streams (user principal))
  (default-to (list) (map-get? stx-sender-streams user))
)

(define-read-only (get-stx-incoming-streams (user principal))
  (default-to (list) (map-get? stx-recipient-streams user))
)

(define-read-only (get-stx-stream-count)
  (var-get stx-stream-nonce)
)

;; ============================================
;; Protocol Stats
;; ============================================

(define-read-only (get-protocol-stats)
  {
    total-sbtc-streamed: (var-get total-sbtc-streamed),
    total-stx-streamed: (var-get total-stx-streamed),
    total-streams-created: (var-get total-streams-created),
    sbtc-stream-count: (var-get stream-nonce),
    stx-stream-count: (var-get stx-stream-nonce),
    protocol-paused: (var-get protocol-paused)
  }
)

(define-read-only (is-protocol-paused)
  (var-get protocol-paused)
)
