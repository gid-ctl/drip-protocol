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