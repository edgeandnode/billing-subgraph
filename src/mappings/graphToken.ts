import { Approval, Transfer, GraphToken } from '../types/GraphToken/GraphToken'
import { createOrLoadUser } from './helpers'

/**
 * @dev handleTransfer
 * - updates accounts, creates if needed
 */
export function handleTransfer(event: Transfer): void {
  let to = event.params.to
  let from = event.params.from
  let value = event.params.value
  let userTo = createOrLoadUser(to)
  let userFrom = createOrLoadUser(from)

  // no need to do any updates if it was a self transfer
  if (to == from) return

  // Mint Transfer
  if (from.toHexString() == '0x0000000000000000000000000000000000000000') {
    userTo.polygonGRTBalance = userTo.polygonGRTBalance.plus(value)

    // Burn Transfer
  } else if (to.toHexString() == '0x0000000000000000000000000000000000000000') {
    userFrom.polygonGRTBalance = userFrom.polygonGRTBalance.minus(value)

    // Normal Transfer
  } else {
    userTo.polygonGRTBalance = userTo.polygonGRTBalance.plus(value)
    userFrom.polygonGRTBalance = userFrom.polygonGRTBalance.minus(value)
  }

  userTo.save()
  userFrom.save()
}

// export function handleApproval(event: Approval): void {
//   let graphNetwork = GraphNetwork.load('1')
//   let staking = graphNetwork.staking
//   let curation = graphNetwork.curation
//   let gns = graphNetwork.gns
//   let spender = event.params.spender
//   let graphAccount = createOrLoadGraphAccount(
//     event.params.owner.toHexString(),
//     event.params.owner,
//     event.block.timestamp,
//   )

//   if (spender == staking) {
//     graphAccount.stakingApproval = event.params.value
//   } else if (spender == curation) {
//     graphAccount.curationApproval = event.params.value
//   } else if (spender == gns) {
//     graphAccount.gnsApproval = event.params.value
//   }
//   graphAccount.save()
// }
