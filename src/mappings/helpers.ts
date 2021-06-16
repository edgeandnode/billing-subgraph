import { User } from '../types/schema'
import { BigInt, Address } from '@graphprotocol/graph-ts'

/**
 * @dev Helper function to load or create a User
 */
export function createOrLoadUser(userAddress: Address): User {
  let id = userAddress.toHexString()
  let user = User.load(id)
  if (user == null) {
    user = new User(id)
    user.billingBalance = BigInt.fromI32(0)
    user.polygonGRTBalance = BigInt.fromI32(0)
  }
  return user as User
}
