import { Billing, TokensAdded, TokensRemoved, TokensPulled } from '../types/schema'
import {
  TokensAdded as AddedEvent,
  TokensRemoved as RemovedEvent,
  TokensPulled as PulledEvent,
  GatewayUpdated,
  NewOwnership,
  Billing as BillingContract,
} from '../types/Billing/Billing'
import { createOrLoadUser } from './helpers'

/**
 * @dev handleEpochRun - Sets the gateway on the Billing Entity. Creates entity on first try
 */
export function handleGatewayUpdated(event: GatewayUpdated): void {
  let billing = Billing.load('1')
  if (billing == null) {
    billing = new Billing('1')
    let contract = BillingContract.bind(event.address)
    billing.governor = contract.governor()
  }
  billing.gateway = event.params.newGateway
  billing.save()
}

/**
 * @dev Sets the governor on the Billing Entity
 */
export function handleNewOwnership(event: NewOwnership): void {
  let billing = Billing.load('1')
  billing.governor = event.params.to
  billing.save()
}

/**
 * @dev Handle the Tokens Added event
 */
export function handleTokensAdded(event: AddedEvent): void {
  let user = createOrLoadUser(event.params.user)
  user.billingBalance = user.billingBalance.plus(event.params.amount)
  user.save()

  let tx = new TokensAdded(
    event.transaction.hash.toHexString().concat(event.transactionLogIndex.toString()),
  )
  tx.hash = event.transaction.hash
  tx.blockNumber = event.block.number.toI32()
  tx.timestamp = event.block.timestamp.toI32()
  tx.user = event.params.user.toHexString()
  tx.amount = event.params.amount
  tx.type = 'TokensAdded'
  tx.save()
}

/**
 * @dev Handle the Tokens Removed event
 */
export function handleTokensRemoved(event: RemovedEvent): void {
  let user = createOrLoadUser(event.params.user)
  user.billingBalance = user.billingBalance.minus(event.params.amount)
  user.save()

  let tx = new TokensRemoved(
    event.transaction.hash.toHexString().concat(event.transactionLogIndex.toString()),
  )
  tx.hash = event.transaction.hash
  tx.blockNumber = event.block.number.toI32()
  tx.timestamp = event.block.timestamp.toI32()
  tx.user = event.params.user.toHexString()
  tx.amount = event.params.amount
  tx.type = 'TokensRemoved'
  tx.to = event.params.to
  tx.save()
}

/**
 * @dev Handle the Tokens Pulled event
 */
export function handleTokensPulled(event: PulledEvent): void {
  let user = createOrLoadUser(event.params.user)
  user.billingBalance = user.billingBalance.minus(event.params.amount)
  user.save()

  let tx = new TokensPulled(
    event.transaction.hash.toHexString().concat(event.transactionLogIndex.toString()),
  )
  tx.hash = event.transaction.hash
  tx.blockNumber = event.block.number.toI32()
  tx.timestamp = event.block.timestamp.toI32()
  tx.user = event.params.user.toHexString()
  tx.amount = event.params.amount
  tx.type = 'TokensPulled'
  tx.save()
}

