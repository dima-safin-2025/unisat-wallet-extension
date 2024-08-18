import { Tabs, Tooltip } from 'antd';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { AddressFlagType, ChainType } from '@/shared/constant';
import { checkAddressFlag } from '@/shared/utils';
import { Card, Column, Content, Footer, Header, Image, Layout, Row, Text } from '@/ui/components';
import AccountSelect from '@/ui/components/AccountSelect';
import { BtcUsd } from '@/ui/components/BtcUsd';
import { Button } from '@/ui/components/Button';
import { DisableUnconfirmedsPopover } from '@/ui/components/DisableUnconfirmedPopover';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { NoticePopover } from '@/ui/components/NoticePopover';
import { UpgradePopover } from '@/ui/components/UpgradePopover';
import { getCurrentTab } from '@/ui/features/browser/tabs';
import { useAccountBalance, useAddressSummary, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { accountActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import {
  useBlockstreamUrl,
  useBTCUnit,
  useChain,
  useChainType,
  useSkipVersionCallback,
  useVersionInfo,
  useWalletConfig
} from '@/ui/state/settings/hooks';
import { useFetchUtxosCallback, useSafeBalance } from '@/ui/state/transactions/hooks';
import { useAssetTabKey, useResetUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { AssetTabKey, uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { amountToSatoshis, satoshisToAmount, useWallet } from '@/ui/utils';

import { BuyBTCModal } from '../../BuyBTC/BuyBTCModal';
import { useNavigate } from '../../MainRoute';
import { SwitchChainModal } from '../../Settings/SwitchChainModal';
import { AtomicalsTab } from './AtomicalsTab';
import { OrdinalsTab } from './OrdinalsTab';
import { RunesList } from './RunesList';

const $noBreakStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all'
};

export default function WalletTabScreen() {
  const navigate = useNavigate();

  const accountBalance = useAccountBalance();
  const chain = useChain();
  const chainType = useChainType();

  const currentKeyring = useCurrentKeyring();
  const currentAccount = useCurrentAccount();
  const balanceValue = useMemo(() => {
    if (accountBalance.amount === '0') {
      return '--';
    } else {
      return accountBalance.amount;
    }
  }, [accountBalance.amount]);

  const wallet = useWallet();
  const [connected, setConnected] = useState(false);

  const dispatch = useAppDispatch();
  const assetTabKey = useAssetTabKey();

  const skipVersion = useSkipVersionCallback();

  const walletConfig = useWalletConfig();
  const versionInfo = useVersionInfo();

  const [showSafeNotice, setShowSafeNotice] = useState(false);
  const [showDisableUnconfirmedUtxoNotice, setShowDisableUnconfirmedUtxoNotice] = useState(false);

  const fetchUtxos = useFetchUtxosCallback();
  const ref = useRef<{ fetchedUtxo: { [key: string]: { loading: boolean } } }>({
    fetchedUtxo: {}
  });
  const [loadingFetch, setLoadingFetch] = useState(false);

  const safeBalance = useSafeBalance();
  const avaiableSatoshis = useMemo(() => {
    return amountToSatoshis(safeBalance);
  }, [safeBalance]);

  const totalSatoshis = amountToSatoshis(accountBalance.amount);
  const unavailableSatoshis = totalSatoshis - avaiableSatoshis;
  const avaiableAmount = safeBalance;
  const unavailableAmount = satoshisToAmount(unavailableSatoshis);
  const totalAmount = satoshisToAmount(totalSatoshis);

  const addressSummary = useAddressSummary();

  useEffect(() => {
    if (currentAccount.address === addressSummary.address) {
      if (addressSummary.arc20Count > 0 || addressSummary.runesCount > 0) {
        if (!checkAddressFlag(currentAccount.flag, AddressFlagType.CONFIRMED_UTXO_MODE)) {
          if (!checkAddressFlag(currentAccount.flag, AddressFlagType.DISABLE_AUTO_SWITCH_CONFIRMED)) {
            wallet.addAddressFlag(currentAccount, AddressFlagType.CONFIRMED_UTXO_MODE).then((account) => {
              dispatch(accountActions.setCurrent(account));
            });
            setShowDisableUnconfirmedUtxoNotice(true);
          }
        }
      }
    }
  }, [addressSummary, currentAccount]);

  useEffect(() => {
    const run = async () => {
      const show = await wallet.getShowSafeNotice();
      setShowSafeNotice(show);

      const activeTab = await getCurrentTab();
      if (!activeTab) return;
      const site = await wallet.getCurrentConnectedSite(activeTab.id);
      if (site) {
        setConnected(site.isConnected);
      }
    };
    run();
  }, []);

  let tabItems = [
    {
      key: AssetTabKey.ORDINALS,
      label: 'Ordinals',
      children: <OrdinalsTab />
    },
    {
      key: AssetTabKey.ATOMICALS,
      label: 'Atomicals',
      children: <AtomicalsTab />
    },
    {
      key: AssetTabKey.RUNES,
      label: 'Runes',
      children: <RunesList />
    }
  ];

  if (chainType !== ChainType.BITCOIN_MAINNET) {
    tabItems = [
      {
        key: AssetTabKey.ORDINALS,
        label: 'Ordinals',
        children: <OrdinalsTab />
      },
      {
        key: AssetTabKey.RUNES,
        label: 'Runes',
        children: <RunesList />
      }
    ];
  }

  const finalAssetTabKey = useMemo(() => {
    if (chainType !== ChainType.BITCOIN_MAINNET && assetTabKey === AssetTabKey.ATOMICALS) {
      return AssetTabKey.ORDINALS;
    } else {
      return assetTabKey;
    }
  }, [assetTabKey, chainType]);

  const blockstreamUrl = useBlockstreamUrl();
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const btcUnit = useBTCUnit();

  const [buyBtcModalVisible, setBuyBtcModalVisible] = useState(false);

  const [switchChainModalVisible, setSwitchChainModalVisible] = useState(false);
  return (
    <Layout>
      <Header
        LeftComponent={
          <Card
            preset="style2"
            onClick={() => {
              navigate('SwitchKeyringScreen');
            }}>
            <Text text={currentKeyring.alianName} size="xxs" />
          </Card>
        }
        RightComponent={
          <Card
            preset="style2"
            style={{
              backgroundColor: 'transparent'
            }}
            onClick={() => {
              setSwitchChainModalVisible(true);
            }}>
            <Image
              src={'./images/artifacts/chain-bar.png'}
              width={56}
              height={28}
              style={{
                position: 'absolute',
                right: 56 / 2
              }}
            />
            <Image
              src={chain.icon}
              size={22}
              style={{
                position: 'absolute',
                right: 55
              }}
            />
          </Card>
        }
      />

      <Content>
        <AccountSelect />

        <Column gap="lg2" mt="md">
          {(walletConfig.chainTip || walletConfig.statusMessage) && (
            <Column
              py={'lg'}
              px={'md'}
              gap={'lg'}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(245, 84, 84, 0.35)',
                background: 'rgba(245, 84, 84, 0.08)'
              }}>
              {walletConfig.chainTip && <Text text={walletConfig.chainTip} color="text" textCenter />}
              {walletConfig.statusMessage && <Text text={walletConfig.statusMessage} color="danger" textCenter />}
            </Column>
          )}

          <Tooltip
            placement={'bottom'}
            title={
              !loadingFetch ? (
                <>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Available '}</span>
                    <span style={$noBreakStyle}>{` ${avaiableAmount} ${btcUnit}`}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Unavailable '}</span>
                    <span style={$noBreakStyle}>{` ${unavailableAmount} ${btcUnit}`}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Total '}</span>
                    <span style={$noBreakStyle}>{` ${totalAmount} ${btcUnit}`}</span>
                  </Row>
                </>
              ) : (
                <>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Available '}</span>
                    <span style={$noBreakStyle}>{'loading...'}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Unavailable '}</span>
                    <span style={$noBreakStyle}>{'loading...'}</span>
                  </Row>
                  <Row justifyBetween>
                    <span style={$noBreakStyle}>{'Total '}</span>
                    <span style={$noBreakStyle}>{` ${totalAmount} ${btcUnit}`}</span>
                  </Row>
                </>
              )
            }
            onOpenChange={(v) => {
              if (!ref.current.fetchedUtxo[currentAccount.address]) {
                ref.current.fetchedUtxo[currentAccount.address] = { loading: true };
                setLoadingFetch(true);
                fetchUtxos().finally(() => {
                  ref.current.fetchedUtxo[currentAccount.address].loading = false;
                  setLoadingFetch(false);
                });
              }
            }}
            overlayStyle={{
              fontSize: fontSizes.xs
            }}>
            <div>
              <Text text={'TOTAL BALANCE'} textCenter color="textDim" />
              <Text text={balanceValue + ' ' + btcUnit} preset="title-bold" textCenter size="xxxl" my="sm" />
            </div>
          </Tooltip>
          <BtcUsd
            sats={amountToSatoshis(balanceValue)}
            textCenter
            size={'md'}
            style={{
              marginTop: -16,
              marginBottom: -8
            }}
          />

          <Row justifyCenter mt="md">
            <Button
              text="Receive"
              preset="home"
              icon="receive"
              onClick={(e) => {
                navigate('ReceiveScreen');
              }}
            />

            <Button
              text="Send"
              preset="home"
              icon="send"
              onClick={(e) => {
                resetUiTxCreateScreen();
                navigate('TxCreateScreen');
              }}
            />
            <Button
              text="History"
              preset="home"
              icon="history"
              onClick={(e) => {
                if (chain.isViewTxHistoryInternally) {
                  navigate('HistoryScreen');
                } else {
                  window.open(`${blockstreamUrl}/address/${currentAccount.address}`);
                }
              }}
            />
            <Button
              text="Buy"
              preset="home"
              icon="bitcoin"
              onClick={(e) => {
                setBuyBtcModalVisible(true);
              }}
              disabled={chainType !== ChainType.BITCOIN_MAINNET}
            />
          </Row>

          <Tabs
            size={'small'}
            defaultActiveKey={finalAssetTabKey as unknown as string}
            activeKey={finalAssetTabKey as unknown as string}
            items={tabItems as unknown as any[]}
            onTabClick={(key) => {
              dispatch(uiActions.updateAssetTabScreen({ assetTabKey: key as unknown as AssetTabKey }));
            }}
          />

          {/*{tabItems[assetTabKey].children}*/}
        </Column>
        {showSafeNotice && (
          <NoticePopover
            onClose={() => {
              wallet.setShowSafeNotice(false);
              setShowSafeNotice(false);
            }}
          />
        )}
        {!versionInfo.skipped && (
          <UpgradePopover
            onClose={() => {
              skipVersion(versionInfo.newVersion);
            }}
          />
        )}

        {showDisableUnconfirmedUtxoNotice && (
          <DisableUnconfirmedsPopover onClose={() => setShowDisableUnconfirmedUtxoNotice(false)} />
        )}
        {buyBtcModalVisible && (
          <BuyBTCModal
            onClose={() => {
              setBuyBtcModalVisible(false);
            }}
          />
        )}
        {switchChainModalVisible && (
          <SwitchChainModal
            onClose={() => {
              setSwitchChainModalVisible(false);
            }}
          />
        )}
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="home" />
      </Footer>
    </Layout>
  );
}
