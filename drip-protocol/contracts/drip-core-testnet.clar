;; DRIP - sBTC & STX Streaming Payments
;; Bitcoin that flows. Stacks that stream.
;; Clarity 4 - TESTNET DEPLOYMENT VERSION
;; Uses real sBTC: ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token

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

;; sBTC token contract - TESTNET
(define-constant SBTC-CONTRACT 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token)

;; ============================================
;; Data Storage
;; ============================================

;; Stream counter for unique IDs (sBTC streams)
(define-data-var stream-nonce uint u0)

;; STX stream counter for unique IDs
(define-data-var stx-stream-nonce uint u0)

;; Stream data structure (sBTC)
(define-map streams
  uint  ;; stream-id
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

;; STX Stream data structure
(define-map stx-streams
  uint  ;; stream-id
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

;; User stream indexes for easy lookup (sBTC)
(define-map sender-streams principal (list 50 uint))
(define-map recipient-streams principal (list 50 uint))

;; User stream indexes for STX streams
(define-map stx-sender-streams principal (list 50 uint))
(define-map stx-recipient-streams principal (list 50 uint))

;; ============================================
;; Private Functions
;; ============================================

;; Calculate how much has vested (unlocked) at the current block (sBTC)
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

;; Calculate how much has vested for STX streams
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

;; Add stream ID to a user's list
(define-private (add-to-list (stream-id uint) (current-list (list 50 uint)))
  (unwrap! (as-max-len? (append current-list stream-id) u50) current-list)
)

;; Get contract's own principal (for use as escrow)
;; Clarity 4: use current-contract keyword
(define-private (get-contract-principal)
  current-contract
)

;; Transfer sBTC from contract (escrow) to a recipient
;; Clarity 4: uses as-contract? with (with-ft) allowance
;; Per Stacks docs: final body expression cannot return response, so use try! inside
;; Token name is "sbtc-token" for testnet sBTC
(define-private (transfer-sbtc-from-escrow (amount uint) (to principal))
  (as-contract? ((with-ft 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token "sbtc-token" amount))
    (try! (contract-call? 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token transfer amount tx-sender to none))
  )
)

;; ============================================
;; Public Functions
;; ============================================

;; Create a new sBTC payment stream
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
    ;; Validate inputs
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration-blocks u0) ERR-INVALID-DURATION)

    ;; Transfer sBTC from sender to this contract (escrow)
    ;; SIP-010 transfer: sender must be tx-sender or contract-caller
    (try! (contract-call? 
      'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token 
      transfer 
      total-amount 
      sender 
      (get-contract-principal)
      none
    ))

    ;; Store stream data
    (map-set streams stream-id {
      sender: sender,
      recipient: recipient,
      total-amount: total-amount,
      withdrawn: u0,
      start-block: start-block,
      end-block: end-block,
      active: true
    })

    ;; Update user indexes
    (map-set sender-streams sender 
      (add-to-list stream-id (default-to (list) (map-get? sender-streams sender)))
    )
    (map-set recipient-streams recipient 
      (add-to-list stream-id (default-to (list) (map-get? recipient-streams recipient)))
    )

    ;; Increment nonce
    (var-set stream-nonce (+ stream-id u1))

    ;; Return the stream ID
    (ok stream-id)
  )
)

;; Withdraw available (vested) funds from a stream
(define-public (withdraw (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) ERR-STREAM-NOT-FOUND))
    (recipient (get recipient stream))
    (withdrawn (get withdrawn stream))
    (vested (calculate-vested-amount stream-id))
    (available (- vested withdrawn))
  )
    ;; Only recipient can withdraw
    (asserts! (is-eq tx-sender recipient) ERR-NOT-RECIPIENT)
    ;; Stream must be active
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)
    ;; Must have funds to withdraw
    (asserts! (> available u0) ERR-STREAM-DEPLETED)

    ;; Transfer sBTC from contract to recipient (Clarity 4)
    (try! (transfer-sbtc-from-escrow available recipient))

    ;; Update withdrawn amount
    (map-set streams stream-id (merge stream { withdrawn: vested }))

    (ok available)
  )
)

;; Cancel a stream (sender only) - returns unvested funds to sender
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
    ;; Only sender can cancel
    (asserts! (is-eq tx-sender sender) ERR-NOT-SENDER)
    ;; Stream must be active
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)

    ;; Transfer remaining vested amount to recipient
    (if (> recipient-amount u0)
      (try! (transfer-sbtc-from-escrow recipient-amount recipient))
      true
    )

    ;; Refund unvested amount to sender
    (if (> sender-refund u0)
      (try! (transfer-sbtc-from-escrow sender-refund sender))
      true
    )

    ;; Mark stream as inactive
    (map-set streams stream-id (merge stream { 
      active: false,
      withdrawn: vested
    }))

    (ok { recipient-received: recipient-amount, sender-refunded: sender-refund })
  )
)

;; ============================================
;; STX Stream Public Functions
;; ============================================

;; Create a new STX payment stream
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
    ;; Validate inputs
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration-blocks u0) ERR-INVALID-DURATION)

    ;; Transfer STX from sender to this contract (escrow)
    ;; Clarity 4: use current-contract keyword to get contract principal
    (try! (stx-transfer? total-amount sender current-contract))

    ;; Store stream data
    (map-set stx-streams stream-id {
      sender: sender,
      recipient: recipient,
      total-amount: total-amount,
      withdrawn: u0,
      start-block: start-block,
      end-block: end-block,
      active: true
    })

    ;; Update user indexes
    (map-set stx-sender-streams sender 
      (add-to-list stream-id (default-to (list) (map-get? stx-sender-streams sender)))
    )
    (map-set stx-recipient-streams recipient 
      (add-to-list stream-id (default-to (list) (map-get? stx-recipient-streams recipient)))
    )

    ;; Increment nonce
    (var-set stx-stream-nonce (+ stream-id u1))

    ;; Return the stream ID
    (ok stream-id)
  )
)

;; Withdraw available (vested) STX from a stream
(define-public (withdraw-stx (stream-id uint))
  (let (
    (stream (unwrap! (map-get? stx-streams stream-id) ERR-STREAM-NOT-FOUND))
    (recipient (get recipient stream))
    (withdrawn (get withdrawn stream))
    (vested (calculate-stx-vested-amount stream-id))
    (available (- vested withdrawn))
  )
    ;; Only recipient can withdraw
    (asserts! (is-eq tx-sender recipient) ERR-NOT-RECIPIENT)
    ;; Stream must be active
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)
    ;; Must have funds to withdraw
    (asserts! (> available u0) ERR-STREAM-DEPLETED)

    ;; Transfer STX from contract to recipient using Clarity 4 as-contract?
    ;; Per Stacks docs: final body expression cannot return response, so use try! inside
    (try! (as-contract? ((with-stx available))
      (try! (stx-transfer? available tx-sender recipient))
    ))

    ;; Update withdrawn amount
    (map-set stx-streams stream-id (merge stream { withdrawn: vested }))

    (ok available)
  )
)

;; Cancel an STX stream (sender only) - returns unvested funds to sender
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
    ;; Only sender can cancel
    (asserts! (is-eq tx-sender sender) ERR-NOT-SENDER)
    ;; Stream must be active
    (asserts! (get active stream) ERR-STREAM-NOT-ACTIVE)

    ;; Transfer remaining vested amount to recipient using Clarity 4 as-contract?
    (if (> recipient-amount u0)
      (try! (as-contract? ((with-stx recipient-amount))
        (try! (stx-transfer? recipient-amount tx-sender recipient))
      ))
      true
    )

    ;; Refund unvested amount to sender using Clarity 4 as-contract?
    (if (> sender-refund u0)
      (try! (as-contract? ((with-stx sender-refund))
        (try! (stx-transfer? sender-refund tx-sender sender))
      ))
      true
    )

    ;; Mark stream as inactive
    (map-set stx-streams stream-id (merge stream { 
      active: false,
      withdrawn: vested
    }))

    (ok { recipient-received: recipient-amount, sender-refunded: sender-refund })
  )
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get stream details
(define-read-only (get-stream (stream-id uint))
  (map-get? streams stream-id)
)

;; Get withdrawable amount for a stream
(define-read-only (get-withdrawable (stream-id uint))
  (let (
    (stream (unwrap! (map-get? streams stream-id) (ok u0)))
    (vested (calculate-vested-amount stream-id))
    (withdrawn (get withdrawn stream))
  )
    (ok (- vested withdrawn))
  )
)

;; Get vested amount for a stream
(define-read-only (get-vested (stream-id uint))
  (ok (calculate-vested-amount stream-id))
)

;; Get stream progress as percentage (0-100)
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

;; Get all streams where user is sender
(define-read-only (get-outgoing-streams (user principal))
  (default-to (list) (map-get? sender-streams user))
)

;; Get all streams where user is recipient
(define-read-only (get-incoming-streams (user principal))
  (default-to (list) (map-get? recipient-streams user))
)

;; Get total number of streams created
(define-read-only (get-stream-count)
  (var-get stream-nonce)
)