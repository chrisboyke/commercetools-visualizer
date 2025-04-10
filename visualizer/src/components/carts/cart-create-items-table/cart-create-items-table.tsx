import { FC } from 'react';
import memoize from 'memoize-one';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  ProjectExtensionProviderForImageRegex,
  useApplicationContext,
} from '@commercetools-frontend/application-shell-connectors';
import messages from './messages';
import {
  TCart,
  TCustomLineItem,
  TLineItem,
} from '../../../types/generated/ctp';
import Constraints from '@commercetools-uikit/constraints';
import DataTable, { TColumn } from '@commercetools-uikit/data-table';
import { INVENTORY_MODES } from '../../../constants';
import IconButton from '@commercetools-uikit/icon-button';
import { BinFilledIcon } from '@commercetools-uikit/icons';
import { isCustomLineItem } from '../../../helpers';

import {
  getSymbolFromCurrency,
  useCurrencies,
} from '@commercetools-frontend/l10n';
import {
  CartItemTableProductCell,
  CartItemTableSubtotalPriceCell,
  CartItemTableTaxRateCell,
  CartItemTableTotalPriceCell,
  CartItemTableUnitGrossPriceCell,
  CartItemTableUnitNetPriceCell,
  CartItemTableUnitPriceCell,
  CartItemTableInventoryCell,
  QuantitySelector,
} from 'commercetools-demo-shared-cart-handling';

export const checkIfTaxIsIncludedInPrice = (
  allLineItems: Array<TLineItem | TCustomLineItem>
) =>
  allLineItems.some(
    (lineItem) => lineItem.taxRate && lineItem.taxRate.includedInPrice
  );

export const createColumnsDefinition = memoize(
  ({ currencySymbol, isTaxIncludedInPrice, isEditable, inventoryMode, intl }) =>
    [
      {
        key: 'name',
        label: <FormattedMessage {...messages.columnProduct} />,
      },
      inventoryMode !== INVENTORY_MODES.NONE && {
        key: 'inventory',
        label: intl.formatMessage(messages.columnInventory),
      },
      isTaxIncludedInPrice && {
        key: 'grossPrice',
        label: (
          <FormattedMessage
            {...messages.columnGrossUnitPrice}
            values={{ currencySymbol }}
          />
        ),
        align: 'right',
      },
      isTaxIncludedInPrice && {
        key: 'netPrice',
        label: (
          <FormattedMessage
            {...messages.columnNetUnitPrice}
            values={{ currencySymbol }}
          />
        ),
        align: 'right',
      },
      !isTaxIncludedInPrice && {
        key: 'price',
        label: (
          <FormattedMessage
            {...messages.columnNetUnitPrice}
            values={{ currencySymbol }}
          />
        ),
        align: 'right',
      },
      {
        key: 'quantity',
        label: <FormattedMessage {...messages.columnQuantity} />,
        align: !isEditable ? 'right' : undefined,
      },
      {
        key: 'subtotalPrice',
        label: (
          <FormattedMessage
            {...messages.columnSubtotalPrice}
            values={{ currencySymbol }}
          />
        ),
        align: 'right',
      },
      {
        key: 'taxRate',
        label: <FormattedMessage {...messages.columnTax} />,
        align: 'right',
      },
      {
        key: 'totalPrice',
        label: (
          <FormattedMessage
            {...messages.columnTotalPrice}
            values={{ currencySymbol }}
          />
        ),
        align: 'right',
      },
      isEditable && {
        key: 'actions',
        label: '',
      },
    ].filter((column) => column)
);

interface Props {
  cart: TCart;
  isEditable?: boolean;
  onRemoveItem?: (itemId: string, isCustom: boolean) => void;
  onChangeQuantity: ({
    quantity,
    id,
    isCustomLineItem,
  }: {
    quantity: number;
    id: string;
    isCustomLineItem: boolean;
  }) => unknown;
  // withCurrencies
  currencies?: Record<
    string,
    {
      label?: string;
      symbol?: string;
    }
  >;
}

export const CartCreateItemsTable: FC<Props> = ({
  isEditable = false,
  onRemoveItem,
  onChangeQuantity,
  cart,
}) => {
  const intl = useIntl();
  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? '',
  }));

  const { data } = useCurrencies(dataLocale);

  const currencySymbol = getSymbolFromCurrency(
    cart.totalPrice.currencyCode,
    data
  );

  const allLineItems = [
    ...(cart.lineItems || []),
    ...(cart.customLineItems || []),
  ];
  const itemRenderer = (
    lineItem: TLineItem | TCustomLineItem,
    column: TColumn<TLineItem | TCustomLineItem>
  ) => {
    const isCustom = isCustomLineItem(lineItem);

    switch (column.key) {
      case 'name':
        return <CartItemTableProductCell lineItem={lineItem} />;
      case 'inventory': {
        return (
          <CartItemTableInventoryCell
            lineItem={lineItem}
            inventoryMode={cart.inventoryMode}
            storeId={cart.store?.id}
          />
        );
      }
      case 'price':
        // unit price, only visible when tax is NOT included in price
        return <CartItemTableUnitPriceCell lineItem={lineItem} />;
      case 'grossPrice':
        // original unit price, only visible when tax is included in price
        return <CartItemTableUnitGrossPriceCell lineItem={lineItem} />;
      case 'netPrice':
        // unit price, only visible when tax is included in price
        return <CartItemTableUnitNetPriceCell lineItem={lineItem} />;
      case 'quantity':
        return isEditable ? (
          <QuantitySelector
            onChange={(quantity) => {
              onChangeQuantity({
                quantity: quantity,
                id: lineItem.id,
                isCustomLineItem: isCustomLineItem(lineItem),
              });
            }}
            quantity={lineItem.quantity}
          />
        ) : (
          lineItem.quantity
        );
      case 'taxRate':
        return (
          <CartItemTableTaxRateCell
            currencySymbol={currencySymbol}
            lineItem={lineItem}
            shipping={cart.shipping}
          />
        );
      case 'subtotalPrice':
        return (
          <CartItemTableSubtotalPriceCell
            directDiscounts={cart.directDiscounts}
            lineItem={lineItem}
          />
        );
      case 'totalPrice':
        return (
          <CartItemTableTotalPriceCell
            directDiscounts={cart.directDiscounts}
            lineItem={lineItem}
          />
        );
      case 'actions':
        return (
          <IconButton
            icon={<BinFilledIcon />}
            label={intl.formatMessage(messages.deleteItemLabel)}
            onClick={() => {
              onRemoveItem && onRemoveItem(lineItem.id, isCustom);
            }}
            size="medium"
          />
        );
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (lineItem as any)[column.key] || '';
    }
  };

  const isTaxIncludedInPrice = checkIfTaxIsIncludedInPrice(allLineItems);

  return (
    <ProjectExtensionProviderForImageRegex>
      <Constraints.Horizontal max="scale">
        <DataTable
          columns={createColumnsDefinition({
            isTaxIncludedInPrice,
            currencySymbol: '€', //getSymbolFromCurrency('EUR', currencies),
            isEditable: isEditable,
            inventoryMode: 'None',
          })}
          itemRenderer={itemRenderer}
          rows={allLineItems}
        />
      </Constraints.Horizontal>
    </ProjectExtensionProviderForImageRegex>
  );
};

export default CartCreateItemsTable;
