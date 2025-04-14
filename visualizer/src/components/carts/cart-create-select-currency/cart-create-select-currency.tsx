import { FC } from 'react';
import { useFormik } from 'formik';
import SelectField from '@commercetools-uikit/select-field';
import messages from './messages';
import { useIntl } from 'react-intl';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useHistory } from 'react-router';
import { StepProps } from '../cart-create/cart-create';
import {
  graphQLErrorHandler,
  useCartCreator,
  useCartUpdater,
} from 'commercetools-demo-shared-data-fetching-hooks';
import { DOMAINS } from '@commercetools-frontend/constants';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import { TCart, TCartDraft } from '../../../types/generated/ctp';
import Spacings from '@commercetools-uikit/spacings';
import { SaveToolbar } from 'commercetools-demo-shared-save-toolbar';

type Props = StepProps & {
  cart?: TCart;
};

export type Step1 = {
  currency: string | undefined;
  country: string | undefined;
};

export const CartCreateSelectCurrency: FC<Props> = ({
  currentStep,
  totalSteps,
  linkToWelcome,
  goToNextStep,
  cart,
}) => {
  const intl = useIntl();
  const history = useHistory();
  const { currencies, dataLocale, countries } = useApplicationContext(
    (context) => ({
      currencies: context.project?.currencies ?? [],
      countries: context.project?.countries ?? [],
      dataLocale: context.dataLocale ?? '',
    })
  );
  const showNotification = useShowNotification();
  const cartCreator = useCartCreator();
  const cartUpdater = useCartUpdater();
  const formik = useFormik<Step1>({
    enableReinitialize: true,
    initialValues: {
      currency: cart?.totalPrice.currencyCode || undefined,
      country: cart?.country || undefined,
    },
    onSubmit: async (formikValues, formikHelpers) => {
      if (!cart) {
        const draft: TCartDraft = {
          currency: formikValues.currency || 'EUR',
          country: formikValues.country || undefined,
        };
        await cartCreator
          .execute({
            draft: draft,
            locale: dataLocale,
          })
          .then(({ data }) => {
            if (data && data.createCart && data.createCart.id) {
              showNotification({
                kind: 'success',
                domain: DOMAINS.SIDE,
                text: intl.formatMessage(messages.createSuccess),
              });
              goToNextStep && goToNextStep(data.createCart.id);
            }
          })
          .catch(graphQLErrorHandler(showNotification, formikHelpers));
      } else {
        await cartUpdater
          .execute({
            actions: [{ setCountry: { country: formikValues.country } }],
            locale: dataLocale,
            id: cart.id,
            version: cart.version,
          })
          .then((updated) => {
            if (updated && updated.data && updated.data.updateCart) {
              showNotification({
                kind: 'success',
                domain: DOMAINS.SIDE,
                text: intl.formatMessage(messages.updateSuccess),
              });
            }
          })
          .catch(graphQLErrorHandler(showNotification, formikHelpers));
      }
    },
  });
  return (
    <Spacings.Stack scale="xl">
      <SelectField
        name="currency"
        title={intl.formatMessage(messages.currencyTitle)}
        isRequired
        value={formik.values.currency}
        options={currencies.map((currency) => {
          return { value: currency, label: currency };
        })}
        errors={SelectField.toFieldErrors<Step1>(formik.errors).currency}
        touched={formik.touched.currency ? formik.touched.currency : undefined}
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
        isDisabled={cart !== undefined}
      />
      <SelectField
        name="country"
        title={intl.formatMessage(messages.countryTitle)}
        isRequired
        value={formik.values.country}
        options={countries.map((country) => {
          return { value: country, label: country };
        })}
        errors={SelectField.toFieldErrors<Step1>(formik.errors).country}
        touched={formik.touched.country ? formik.touched.country : undefined}
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
      />
      <SaveToolbar
        isVisible={formik.dirty}
        buttonProps={{ next: { isDisabled: !formik.isValid } }}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={() => {
          formik.handleSubmit();
        }}
        onSave={() => {
          formik.handleSubmit();
        }}
        onCancel={() => {
          history.replace({
            pathname: linkToWelcome + '/carts',
          });
        }}
      />
    </Spacings.Stack>
  );
};

export default CartCreateSelectCurrency;
