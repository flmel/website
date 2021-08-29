import {initNEAR, login, logout, add_proposal,
        get_policy, get_proposals, act_proposal} from './blockchain/dao.js'

import {create_selector, change_kind, get_kind, proposal_to_html} from './dao_ui.js'


async function get_and_display_policy(){
  const policy = await get_policy()

  $('#dao-address').html(window.nearConfig.DAOaddress)
  $('#dao-bond').html(policy.proposal_bond)
  $('#dao-time').html(policy.proposal_period)

  // Get council from Roles object
  let council_html = ''

  for(let i=0; i<policy.roles.length; i++){
    if(policy.roles[i].name == 'council'){
      window.council = policy.roles[i].kind.Group
      council_html = council.join(', ')
    }
  }

  $('#dao-council').html(council_html)
}

async function get_and_display_proposals(){
  console.log("Getting last 10 proposals from the DAO - VIEW")

  let proposals = await get_proposals(0, 10)

  let components = ''
  for(let i=proposals.length-1; i>=0; i--){
    components += proposal_to_html(proposals[i])
  }

  $('#existing-proposals').html(components)
  return proposals
}

async function flow(){
  await get_and_display_policy()
  const proposals = await get_and_display_proposals()

  if (!window.walletAccount.accountId){
    $(".logged-in").hide()
  }else{
    $(".logged-out").hide()
    $('#account').html(window.walletAccount.accountId)
    create_selector('e-kind')
    add_buttons_to_proposals(proposals)
  }
}

function add_buttons_to_proposals(proposals){
    // Add buttons
    const is_council = window.council.includes(window.walletAccount.accountId)
    let disabled = (is_council)? '': 'disabled'

    for(let i=proposals.length-1; i>=0; i--){
      const proposal = proposals[i]
      let buttons = ''
      if (proposal.status == 'InProgress'){
        buttons += `<button ${disabled} onclick="vote(${proposal.id}, 'VoteApprove')" class="btn btn-primary mb-2">Approve</button>
                    <button ${disabled} onclick="vote(${proposal.id}, 'VoteReject')" class="btn btn-danger mb-2">Reject</button>`
      }

      $(`#p-buttons-${proposal.id}`).html(buttons)
    }

}

// Globals
window.login = login
window.logout = logout
window.change_kind = change_kind
window.council = []

window.onload = function(){
  window.nearInitPromise = initNEAR()
  .then(flow)
  .catch(console.error)
}

window.vote = async function vote(id, action){
  try{
    await act_proposal(id, action)
    window.location.replace(window.location.origin + window.location.pathname)
  }catch{
    alert("Error while voting")
  }
}

window.submit_proposal = function submit_proposal(){
  const description = $('#e-description')[0].value
  const kind = get_kind()
  add_proposal(description, kind)
}