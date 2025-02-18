import { getConfig, floor } from "./aux.js";
export { floor } from "./aux.js";

const nearConfig = getConfig("pool");

window.nearApi = nearApi;

export function login() {
  walletConnection.requestSignIn(nearConfig.contractName, "Pool Party");
}

export function logout() {
  walletConnection.signOut();
  window.location.replace(window.location.origin + window.location.pathname);
}

export async function initNEAR() {
  // Initializing connection to the NEAR node.
  const near = await nearApi.connect(
    Object.assign(nearConfig, {
      deps: { keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore() },
    }),
  );

  // Needed to access wallet login
  window.walletConnection = await new nearApi.WalletConnection(
    near,
    nearConfig.contractName,
  );
  window.walletAccount = walletConnection.account();

  // Initializing our contract APIs by contract name and configuration.
  window.contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: [
      "get_account",
      "get_pool_info",
      "get_winners",
      "get_to_unstake",
      "select_winner",
      "get_guardian",
      "get_user_info",
      "get_user_by_id",
      "get_user_tickets",
      "get_accum_weights",
      "get_number_of_winners",
    ],
    changeMethods: [
      "unstake",
      "deposit_and_stake",
      "withdraw_all",
      "update_prize",
      "raffle",
      "interact_external",
    ],
    sender: window.walletAccount.accountId,
  });
}

export async function stake(_amount) {
  let amount = nearApi.utils.format.parseNearAmount(_amount.toString());
  const account = window.walletConnection.account();
  account.functionCall(
    nearConfig.contractName,
    "deposit_and_stake",
    {},
    300000000000000,
    amount,
  );
}

export async function unstake(amount) {
  amount = floor(amount);
  amount = nearApi.utils.format.parseNearAmount(amount.toString());
  let result = await contract.account.functionCall(
    nearConfig.contractName,
    "unstake",
    { amount: amount },
    100000000000000,
    0,
  );
  return nearApi.providers.getTransactionLastResult(result);
}

export async function interact_external() {
  let result = await contract.account.functionCall(
    nearConfig.contractName,
    "interact_external",
    {},
    300000000000000,
    0,
  );

  return nearApi.providers.getTransactionLastResult(result);
}

export async function withdraw() {
  let result = await contract.account.functionCall(
    nearConfig.contractName,
    "withdraw_all",
    {},
    20000000000000,
    0,
  );

  return nearApi.providers.getTransactionLastResult(result);
}

export async function get_account(account_id) {
  let info = await contract.get_user_info({ user: account_id });
  info.staked = floor(nearApi.utils.format.formatNearAmount(info.staked));
  return info;
}

export async function get_pool_info() {
  let info = await contract.get_pool_info();

  info.total_staked = floor(
    nearApi.utils.format.formatNearAmount(info.tickets),
  );
  info.pool_reserve = floor(
    nearApi.utils.format.formatNearAmount(info.pool_reserve),
  );
  info.prize = floor(nearApi.utils.format.formatNearAmount(info.prize));
  info.next_raffle = Number(info.next_raffle);
  info.last_prize_update = Number(
    (info.last_prize_update / 1000000).toFixed(0),
  );

  return info;
}

export async function get_last_winners() {
  let imax = await contract.get_number_of_winners();
  let imin = imax >= 10 ? imax - 10 : 0;

  let info = await contract.get_winners({ from: imin, until: imax });
  return info;
}

export async function update_prize() {
  let result = await contract.account.functionCall(
    nearConfig.contractName,
    "update_prize",
    {},
    300000000000000,
    0,
  );

  let prize = nearApi.providers.getTransactionLastResult(result);
  return floor(nearApi.utils.format.formatNearAmount(prize));
}

export async function raffle() {
  let result = await contract.account.functionCall(
    nearConfig.contractName,
    "raffle",
    {},
    300000000000000,
    0,
  );
  let winner = nearApi.providers.getTransactionLastResult(result);
  return winner;
}
