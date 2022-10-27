import { Bytes, BigInt, Address, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as/assembly/index'
import {
  Billing,
  Collector,
  User,
  TokensAdded,
  TokensRemoved,
  TokensPulled,
  BillingDailyData,
  UserDailyData,
} from '../src/types/schema'
import {
  TokensAdded as AddedEvent,
  TokensRemoved as RemovedEvent,
  TokensPulled as PulledEvent,
  InsufficientBalanceForRemoval as InsufficientBalanceForRemovalEvent,
  CollectorUpdated,
  NewOwnership,
} from '../src/types/Billing/Billing'

//
//
// event CollectorUpdated(address indexed collector, bool enabled);
export function createCollectorUpdated(address: String, enabled: boolean): CollectorUpdated {
  let mockEvent = newMockEvent()
  let event = new CollectorUpdated(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  )

  event.parameters = new Array()
  let addressParam = new ethereum.EventParam(
    'collector',
    ethereum.Value.fromAddress(Address.fromString(address)),
  )
  let enabledParam = new ethereum.EventParam(
    'enabled',
    ethereum.Value.fromBoolean(enabled),
  )

  event.parameters.push(addressParam)
  event.parameters.push(enabledParam)

  return event
}
// event NewOwnership(address indexed from, address indexed to);
export function createNewOwnership(from: String, to: String): NewOwnership {
  let mockEvent = newMockEvent()
  let event = new NewOwnership(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  )

  event.parameters = new Array()
  let addressParam = new ethereum.EventParam(
    'from',
    ethereum.Value.fromAddress(Address.fromString(from)),
  )
  let addressParam2 = new ethereum.EventParam(
    'to',
    ethereum.Value.fromAddress(Address.fromString(to)),
  )

  event.parameters.push(addressParam)
  event.parameters.push(addressParam2)

  return event
}

// event TokensAdded(address indexed user, uint256 amount);
export function createAddedEvent(userAddress: String, grtAmount: BigInt): AddedEvent {
  let mockEvent = newMockEvent()
  let event = new AddedEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  )

  event.parameters = new Array()
  let addressParam = new ethereum.EventParam(
    'user',
    ethereum.Value.fromAddress(Address.fromString(userAddress)),
  )
  let amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(grtAmount))

  event.parameters.push(addressParam)
  event.parameters.push(amountParam)

  return event
}

// event TokensRemoved(address indexed from, address indexed to, uint256 amount);
export function createRemovedEvent(userAddress: String, toAddress: String, grtAmount: BigInt): RemovedEvent {
  let mockEvent = newMockEvent()
  let event = new RemovedEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  )

  event.parameters = new Array()
  let addressParam = new ethereum.EventParam(
    'from',
    ethereum.Value.fromAddress(Address.fromString(userAddress)),
  )
  let addressParam2 = new ethereum.EventParam(
    'to',
    ethereum.Value.fromAddress(Address.fromString(toAddress)),
  )
  let amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(grtAmount))

  event.parameters.push(addressParam)
  event.parameters.push(addressParam2)
  event.parameters.push(amountParam)

  return event
}

// event InsufficientBalanceForRemoval(address indexed from, address indexed to, uint256 amount);
export function createInsufficientBalanceEvent(userAddress: String, toAddress: String, grtAmount: BigInt): InsufficientBalanceForRemovalEvent {
  let mockEvent = newMockEvent()
  let event = new InsufficientBalanceForRemovalEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  )

  event.parameters = new Array()
  let addressParam = new ethereum.EventParam(
    'from',
    ethereum.Value.fromAddress(Address.fromString(userAddress)),
  )
  let addressParam2 = new ethereum.EventParam(
    'to',
    ethereum.Value.fromAddress(Address.fromString(toAddress)),
  )
  let amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(grtAmount))

  event.parameters.push(addressParam)
  event.parameters.push(addressParam2)
  event.parameters.push(amountParam)

  return event
}

// event TokensPulled(address indexed user, uint256 amount);
export function createPulledEvent(userAddress: String, grtAmount: BigInt): PulledEvent {
  let mockEvent = newMockEvent()
  let event = new PulledEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  )

  event.parameters = new Array()
  let addressParam = new ethereum.EventParam(
    'user',
    ethereum.Value.fromAddress(Address.fromString(userAddress)),
  )
  let amountParam = new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(grtAmount))

  event.parameters.push(addressParam)
  event.parameters.push(amountParam)

  return event
}

export function createEmptyBilling(): Billing {
  let billing = new Billing('1')
  billing.governor = Address.fromString('0x1111111111111111111111111111111111111111')
  billing.save()

  let collector = new Collector('0x1111111111111111111111111111111111111112')
  collector.billing = billing.id
  collector.save()

  return Billing.load('1')!
}
