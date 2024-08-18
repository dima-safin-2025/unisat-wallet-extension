import { useNavigate } from '@/ui/pages/MainRoute';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { copyToClipboard, shortAddress } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';

import { useTools } from '../ActionComponent';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import './index.less';

const AccountSelect = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const tools = useTools();
  const address = currentAccount.address;
  return (
    <Row justifyBetween px="md" py="md" bg="card" rounded itemsCenter>
      <Row style={{ flex: 1 }}>
        <Icon icon="user" />
      </Row>

      <Column
        justifyCenter
        rounded
        px="sm"
        style={{
          flex: 1
        }}
        onClick={(e) => {
          copyToClipboard(address).then(() => {
            tools.toastSuccess('Copied');
          });
        }}>
        <Text text={shortAddress(currentAccount?.alianName, 8)} textCenter />
        <Row selfItemsCenter itemsCenter>
          <Text text={shortAddress(address)} color="textDim" />
          <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
        </Row>
      </Column>

      <Row
        style={{ flex: 1 }}
        fullY
        justifyEnd
        itemsCenter
        onClick={(e) => {
          navigate('SwitchAccountScreen');
        }}>
        <Icon icon="right" />
      </Row>
    </Row>
  );
};

export default AccountSelect;
