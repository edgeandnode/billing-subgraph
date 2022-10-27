import { clearStore, test, assert, newMockEvent } from 'matchstick-as/assembly/index'
import {
  handleCollectorUpdated,
  handleNewOwnership,
  handleTokensAdded,
  handleTokensRemoved,
  handleInsufficientBalanceForRemoval,
  handleTokensPulled,
} from '../src/mappings/billing'
import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import {
  createAddedEvent,
  createRemovedEvent,
  createPulledEvent,
  createInsufficientBalanceEvent,
  createEmptyBilling,
  createCollectorUpdated,
  createNewOwnership,
} from './billing-scaffolding'
import { Billing } from '../src/types/schema'

function stringToValue(str: String): ethereum.Value {
  return ethereum.Value.fromString(str)
}

function assertEqualCollectorArrays(actualArray: Array<String>, expectedArray: Array<String>): void {
  assert.arrayEquals(actualArray.sort().map<ethereum.Value>((collector: String, _: i32, __: Array<String>) => {
    return stringToValue(collector)
  }), expectedArray.sort().map<ethereum.Value>((collector: String, _: i32, __: Array<String>) => {
    return stringToValue(collector)
  }))
}
/*
 * GatewayUpdated
 */
test('Collector update', () => {
  let billing = createEmptyBilling()
  const oldCollectorAddressString = '0x1111111111111111111111111111111111111112'
  
  assertEqualCollectorArrays(billing.collectors, [oldCollectorAddressString])

  const newCollectorAddressString = '0x0101010101010101010101010101010101010101'
  let collectorUpdatedEvent = createCollectorUpdated(newCollectorAddressString, true)

  handleCollectorUpdated(collectorUpdatedEvent)

  billing = Billing.load('1')!
  assertEqualCollectorArrays(billing.collectors, [oldCollectorAddressString, newCollectorAddressString])
  collectorUpdatedEvent = createCollectorUpdated(oldCollectorAddressString, false)

  handleCollectorUpdated(collectorUpdatedEvent)

  billing = Billing.load('1')!
  assertEqualCollectorArrays(billing.collectors, [newCollectorAddressString])
  clearStore()
})

/*
 * NewOwnership
 */
test('NewOwnership', () => {
  let billing = createEmptyBilling()
  let oldGovernorAddressString = billing.governor.toHexString()
  let newGovernorAddressString = '0x0101010101010101010101010101010101010101'
  let newOwnershipEvent = createNewOwnership(oldGovernorAddressString, newGovernorAddressString)

  assert.fieldEquals('Billing', '1', 'governor', oldGovernorAddressString)

  handleNewOwnership(newOwnershipEvent)

  assert.fieldEquals('Billing', '1', 'governor', newGovernorAddressString)

  clearStore()
})

/*
 * AddedEvents
 */
test('Add tokens for the first time', () => {
  createEmptyBilling()
  let userAddress = '0x0101010101010101010101010101010101010101'
  let grtAmountString = '10000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)

  let addedEvent = createAddedEvent(userAddress, grtAmount)

  handleTokensAdded(addedEvent)

  // both User and global Billing should have the same totalTokensAdded
  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  clearStore()
})

test('Add tokens multiple times', () => {
  createEmptyBilling()
  let userAddress1 = '0x0101010101010101010101010101010101010101'
  let userAddress2 = '0x0101010101010101010101010101010101010102'
  let grtAmountString = '10000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)

  let addedEvent1 = createAddedEvent(userAddress1, grtAmount)
  let addedEvent2 = createAddedEvent(userAddress2, grtAmount)

  handleTokensAdded(addedEvent1)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress1, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  // Also assert that user2 isn't created
  assert.notInStore('User', userAddress2)

  handleTokensAdded(addedEvent2)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', '20000000000000000000')

  assert.fieldEquals('User', userAddress1, 'billingBalance', grtAmountString)
  assert.fieldEquals('User', userAddress2, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '20000000000000000000')

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', '0')
  assert.fieldEquals('User', userAddress2, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', '0')
  assert.fieldEquals('User', userAddress2, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  clearStore()
})

/*
 * RemovedEvents
 */
test('Fully remove tokens', () => {
  createEmptyBilling()
  let userAddress = '0x0101010101010101010101010101010101010101'
  let toAddress = '0x0101010101010101010101010101010101010102'
  let grtAmountString = '10000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)

  let addedEvent = createAddedEvent(userAddress, grtAmount)

  handleTokensAdded(addedEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let removeEvent = createRemovedEvent(userAddress, toAddress, grtAmount)

  handleTokensRemoved(removeEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', '0')
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', grtAmountString)

  clearStore()
})

/*
 * InsufficientBalanceForRemoval
 * These events don't affect a user's balance/transactions,
 * but we surface them so that they can eventually be made visible in the UI
 */
test('Reporting insufficient balance for removal', () => {
  createEmptyBilling()
  const userAddress = '0x0101010101010101010101010101010101010101'
  const toAddress = '0x0101010101010101010101010101010101010102'
  const grtAmountString = '10000000000000000000'
  const grtAmount = BigInt.fromString(grtAmountString)

  const insufficientBalanceEvent = createInsufficientBalanceEvent(userAddress, toAddress, grtAmount)

  handleInsufficientBalanceForRemoval(insufficientBalanceEvent)

  const id = insufficientBalanceEvent.transaction.hash.toHexString().concat(insufficientBalanceEvent.transactionLogIndex.toString())
  assert.fieldEquals('InsufficientBalanceForRemoval', id, 'user', userAddress)
  assert.fieldEquals('InsufficientBalanceForRemoval', id, 'to', toAddress)
  assert.fieldEquals('InsufficientBalanceForRemoval', id, 'amount', grtAmountString)
  assert.fieldEquals('InsufficientBalanceForRemoval', id, 'hash', insufficientBalanceEvent.transaction.hash.toHexString())
  assert.fieldEquals('InsufficientBalanceForRemoval', id, 'blockNumber', insufficientBalanceEvent.block.number.toString())
  assert.fieldEquals('InsufficientBalanceForRemoval', id, 'timestamp', insufficientBalanceEvent.block.timestamp.toString())

  clearStore()
})

test('Partially remove tokens', () => {
  createEmptyBilling()
  let userAddress = '0x0101010101010101010101010101010101010101'
  let toAddress = '0x0101010101010101010101010101010101010102'
  let grtAmountString = '10000000000000000000'
  let halfGrtAmountString = '5000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)
  let halfGrtAmount = BigInt.fromString(halfGrtAmountString)

  let addedEvent = createAddedEvent(userAddress, grtAmount)

  handleTokensAdded(addedEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let removeEvent = createRemovedEvent(userAddress, toAddress, halfGrtAmount)

  handleTokensRemoved(removeEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', halfGrtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', halfGrtAmountString)

  clearStore()
})

/*
 * PulledEvents
 */
test('Fully pull tokens', () => {
  createEmptyBilling()
  let userAddress = '0x0101010101010101010101010101010101010101'
  let grtAmountString = '10000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)

  let addedEvent = createAddedEvent(userAddress, grtAmount)

  handleTokensAdded(addedEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let pulledEvent = createPulledEvent(userAddress, grtAmount)

  handleTokensPulled(pulledEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', '0')
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  clearStore()
})

test('Partially pull tokens', () => {
  createEmptyBilling()
  let userAddress = '0x0101010101010101010101010101010101010101'
  let grtAmountString = '10000000000000000000'
  let halfGrtAmountString = '5000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)
  let halfGrtAmount = BigInt.fromString(halfGrtAmountString)

  let addedEvent = createAddedEvent(userAddress, grtAmount)

  handleTokensAdded(addedEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let pulledEvent = createPulledEvent(userAddress, halfGrtAmount)

  handleTokensPulled(pulledEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', halfGrtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', halfGrtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  clearStore()
})

/*
 * Mixed event tests
 */

test('Pull half remove half', () => {
  createEmptyBilling()
  let userAddress = '0x0101010101010101010101010101010101010101'
  let toAddress = '0x0101010101010101010101010101010101010102'
  let grtAmountString = '10000000000000000000'
  let halfGrtAmountString = '5000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)
  let halfGrtAmount = BigInt.fromString(halfGrtAmountString)

  let addedEvent = createAddedEvent(userAddress, grtAmount)

  handleTokensAdded(addedEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let pulledEvent = createPulledEvent(userAddress, halfGrtAmount)

  handleTokensPulled(pulledEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', halfGrtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', halfGrtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let removeEvent = createRemovedEvent(userAddress, toAddress, halfGrtAmount)

  handleTokensRemoved(removeEvent)

  assert.fieldEquals('User', userAddress, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress, 'billingBalance', '0')
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '0')

  assert.fieldEquals('User', userAddress, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', halfGrtAmountString)

  assert.fieldEquals('User', userAddress, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', halfGrtAmountString)

  clearStore()
})

test('2 users add, pull/remove, remove/pull', () => {
  createEmptyBilling()
  let userAddress1 = '0x0101010101010101010101010101010101010101'
  let userAddress2 = '0x0101010101010101010101010101010101010102'
  let grtAmountString = '10000000000000000000'
  let halfGrtAmountString = '5000000000000000000'
  let grtAmount = BigInt.fromString(grtAmountString)
  let halfGrtAmount = BigInt.fromString(halfGrtAmountString)

  let addedEvent = createAddedEvent(userAddress1, grtAmount)

  handleTokensAdded(addedEvent)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', grtAmountString)

  assert.fieldEquals('User', userAddress1, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let addedEvent2 = createAddedEvent(userAddress2, grtAmount)

  handleTokensAdded(addedEvent2)

  assert.fieldEquals('User', userAddress2, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', '20000000000000000000')

  assert.fieldEquals('User', userAddress2, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '20000000000000000000')

  assert.fieldEquals('User', userAddress2, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', '0')

  assert.fieldEquals('User', userAddress2, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let pulledEvent = createPulledEvent(userAddress1, halfGrtAmount)

  handleTokensPulled(pulledEvent)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', '20000000000000000000')

  assert.fieldEquals('User', userAddress1, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'billingBalance', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '15000000000000000000')

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', halfGrtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', '0')
  assert.fieldEquals('User', userAddress2, 'totalTokensRemoved', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', '0')

  let removeEvent = createRemovedEvent(userAddress2, userAddress1, halfGrtAmount)

  handleTokensRemoved(removeEvent)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', '20000000000000000000')

  assert.fieldEquals('User', userAddress1, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', grtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', halfGrtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', '0')
  assert.fieldEquals('User', userAddress2, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', halfGrtAmountString)

  let removeEvent2 = createRemovedEvent(userAddress1, userAddress2, halfGrtAmount)

  handleTokensRemoved(removeEvent2)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', '20000000000000000000')

  assert.fieldEquals('User', userAddress1, 'billingBalance', '0')
  assert.fieldEquals('User', userAddress2, 'billingBalance', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', halfGrtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensPulled', '0')
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', halfGrtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', grtAmountString)

  let pulledEvent2 = createPulledEvent(userAddress2, halfGrtAmount)

  handleTokensPulled(pulledEvent2)

  assert.fieldEquals('User', userAddress1, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensAdded', grtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensAdded', '20000000000000000000')

  assert.fieldEquals('User', userAddress1, 'billingBalance', '0')
  assert.fieldEquals('User', userAddress2, 'billingBalance', '0')
  assert.fieldEquals('Billing', '1', 'totalCurrentBalance', '0')

  assert.fieldEquals('User', userAddress1, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensPulled', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensPulled', grtAmountString)

  assert.fieldEquals('User', userAddress1, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('User', userAddress2, 'totalTokensRemoved', halfGrtAmountString)
  assert.fieldEquals('Billing', '1', 'totalTokensRemoved', grtAmountString)

  clearStore()
})
