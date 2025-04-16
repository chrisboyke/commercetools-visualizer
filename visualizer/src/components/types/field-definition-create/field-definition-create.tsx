import { FC, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { CustomFormModalPage } from '@commercetools-frontend/application-components';
import { RevertIcon } from '@commercetools-uikit/icons';
import { useParams } from 'react-router-dom';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import { DOMAINS } from '@commercetools-frontend/constants';
import { PERMISSIONS } from '../../../constants';
import messages from '../field-definition-input/messages';
import FieldDefinitionInput from '../field-definition-input/field-definition-input';
import {
  fromFormValuesToTFieldDefinitionInput,
  initialValuesFromFieldDefinition,
  TFormValues,
} from '../field-definition-input/helpers';
import {
  graphQLErrorHandler,
  useTypeDefinitionUpdater,
} from 'commercetools-demo-shared-data-fetching-hooks';

type Props = {
  onClose: () => Promise<void>;
};

const FieldDefinitionCreate: FC<Props> = ({ onClose }) => {
  const { id, version } = useParams<{
    id: string;
    version: string;
  }>();

  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });

  const showNotification = useShowNotification();

  const typeDefinitionUpdater = useTypeDefinitionUpdater();

  const { dataLocale, projectLanguages } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? '',
    projectLanguages: context.project?.languages ?? [],
  }));
  const intl = useIntl();

  const handleSubmit = useCallback(
    async (formikValues: TFormValues, formikHelpers) => {
      const actionDraft = fromFormValuesToTFieldDefinitionInput(formikValues);
      await typeDefinitionUpdater
        .execute({
          id: id,
          version: Number(version),
          actions: [{ addFieldDefinition: { fieldDefinition: actionDraft } }],
        })
        .then(async () => {
          showNotification({
            kind: 'success',
            domain: DOMAINS.SIDE,
            text: intl.formatMessage(messages.fieldDefinitionUpdated, {}),
          });
          return onClose();
        })
        .catch(graphQLErrorHandler(showNotification, formikHelpers));
    },
    [id, typeDefinitionUpdater, version]
  );

  return (
    <FieldDefinitionInput
      initialValues={initialValuesFromFieldDefinition(
        undefined,
        projectLanguages
      )}
      onSubmit={handleSubmit}
      createNewMode={true}
      dataLocale={dataLocale}
    >
      {(formProps) => {
        return (
          <CustomFormModalPage
            isOpen
            onClose={onClose}
            title={intl.formatMessage(messages.modalTitle)}
            //subtitle={<LabelRequired />}
            topBarCurrentPathLabel={intl.formatMessage(messages.modalTitle)}
            formControls={
              <>
                <CustomFormModalPage.FormSecondaryButton
                  label={intl.formatMessage(messages.revert)}
                  iconLeft={<RevertIcon />}
                  onClick={onClose}
                  isDisabled={
                    formProps.isSubmitting || !formProps.isDirty || !canManage
                  }
                />
                <CustomFormModalPage.FormPrimaryButton
                  label={messages.newButton}
                  onClick={() => formProps.submitForm()}
                  isDisabled={
                    formProps.isSubmitting || !formProps.isDirty || !canManage
                  }
                />
              </>
            }
          >
            {formProps.formElements}
          </CustomFormModalPage>
        );
      }}
    </FieldDefinitionInput>
  );
};

FieldDefinitionCreate.displayName = 'NewFieldDefinitionInput';

export default FieldDefinitionCreate;
