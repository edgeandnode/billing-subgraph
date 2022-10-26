import { TokensAdded, TokensRemoved, TokensPulled, InsufficientBalanceForRemoval } from '../types/schema'
import {
  TokensAdded as AddedEvent,
  TokensRemoved as RemovedEvent,
  TokensPulled as PulledEvent,
  InsufficientBalanceForRemoval as InsufficientBalanceForRemovalEvent,
  CollectorUpdated,
  NewOwnership,
} from '../types/Billing/Billing'

import {
  getBilling,
  createOrLoadUser,
  getAndUpdateBillingDailyData,
  getAndUpdateUserDailyData,
} from './helpers'

/**
 * @dev handleEpochRun - Sets the gateways ("collectors") on the Billing Entity. Creates entity on first try
 */
export function handleCollectorUpdated(event: CollectorUpdated): void {
  let billing = getBilling(event.address)
  const existingCollectorIndex = billing.collectors.indexOf(event.params.collector)
  if (existingCollectorIndex > -1) {
    if (!event.params.enabled) {
      billing.collectors.splice(existingCollectorIndex, 1)
    }
  } else if (event.params.enabled) {
    billing.collectors.push(event.params.collector)
  }

  getAndUpdateBillingDailyData(billing, event.block.timestamp)
  billing.save()
}

/**
 * @dev Sets the governor on the Billing Entity
 */
export function handleNewOwnership(event: NewOwnership): void {
  let billing = getBilling(event.address)
  billing.governor = event.params.to

  getAndUpdateBillingDailyData(billing, event.block.timestamp)

  billing.save()
}

/**
 * @dev Handle the Tokens Added event
 */
export function handleTokensAdded(event: AddedEvent): void {
  let billing = getBilling(event.address)
  let user = createOrLoadUser(event.params.user)

  user.billingBalance = user.billingBalance.plus(event.params.amount)
  user.totalTokensAdded = user.totalTokensAdded.plus(event.params.amount)

  billing.totalCurrentBalance = billing.totalCurrentBalance.plus(event.params.amount)
  billing.totalTokensAdded = billing.totalTokensAdded.plus(event.params.amount)

  getAndUpdateUserDailyData(user, event.block.timestamp)
  getAndUpdateBillingDailyData(billing, event.block.timestamp)

  user.save()
  billing.save()

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
  let billing = getBilling(event.address)
  let user = createOrLoadUser(event.params.from)

  user.billingBalance = user.billingBalance.minus(event.params.amount)
  user.totalTokensRemoved = user.totalTokensRemoved.plus(event.params.amount)

  billing.totalCurrentBalance = billing.totalCurrentBalance.minus(event.params.amount)
  billing.totalTokensRemoved = billing.totalTokensRemoved.plus(event.params.amount)

  getAndUpdateUserDailyData(user, event.block.timestamp)
  getAndUpdateBillingDailyData(billing, event.block.timestamp)

  user.save()
  billing.save()

  let tx = new TokensRemoved(
    event.transaction.hash.toHexString().concat(event.transactionLogIndex.toString()),
  )
  tx.hash = event.transaction.hash
  tx.blockNumber = event.block.number.toI32()
  tx.timestamp = event.block.timestamp.toI32()
  tx.user = event.params.from.toHexString()
  tx.amount = event.params.amount
  tx.type = 'TokensRemoved'
  tx.to = event.params.to
  tx.save()
}

/**
 * @dev Handle the Tokens Removed event
 */
 export function handleInsufficientBalanceForRemoval(event: InsufficientBalanceForRemovalEvent): void {

  let ev = new InsufficientBalanceForRemoval(
    event.transaction.hash.toHexString().concat(event.transactionLogIndex.toString()),
  )
  ev.hash = event.transaction.hash
  ev.blockNumber = event.block.number.toI32()
  ev.timestamp = event.block.timestamp.toI32()
  ev.user = event.params.from.toHexString()
  ev.amount = event.params.amount
  ev.to = event.params.to
  ev.save()
}

/**
 * @dev Handle the Tokens Pulled event
 */
export function handleTokensPulled(event: PulledEvent): void {
  let billing = getBilling(event.address)
  let user = createOrLoadUser(event.params.user)

  user.billingBalance = user.billingBalance.minus(event.params.amount)
  user.totalTokensPulled = user.totalTokensPulled.plus(event.params.amount)

  billing.totalCurrentBalance = billing.totalCurrentBalance.minus(event.params.amount)
  billing.totalTokensPulled = billing.totalTokensPulled.plus(event.params.amount)

  getAndUpdateUserDailyData(user, event.block.timestamp)
  getAndUpdateBillingDailyData(billing, event.block.timestamp)

  user.save()
  billing.save()

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
