// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../@types/commercetools__sync-actions/index.d.ts" />

import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { ApolloError, ApolloQueryResult } from '@apollo/client';
import { transformLocalizedFieldToLocalizedString } from '@commercetools-frontend/l10n';
import LocalizedTextInput from '@commercetools-uikit/localized-text-input';
import { createSyncTypes } from '@commercetools/sync-actions';
import {
  TQuery,
  Maybe,
  TTypeDefinition,
  TQuery_TypeDefinitionArgs,
  TMutation,
  TMutation_UpdateTypeDefinitionArgs,
  TTypeUpdateAction,
  TMutation_CreateTypeDefinitionArgs,
  TTypeDefinitionDraft,
  TMutation_DeleteTypeDefinitionArgs,
} from '../../types/generated/ctp';
import {
  createGraphQlUpdateActions,
  extractErrorFromGraphQlResponse,
} from '../../helpers';
import FetchQuery from './edit/fetch-type.ctp.graphql';
import DeleteQuery from './edit/delete-type-definition-id.ctp.graphql';
import UpdateTypeDefinitionIdMutation from './edit/update-type.ctp.graphql';
import CreateTypeDefinitionMutation from './new/create-type.ctp.graphql';
import TypeWithDefinitionByName from './field-definition-input/fetch-type.ctp.graphql';
import { TFormValues } from './type-form/TypeDefinitionDetailsForm';

const syncTypes = createSyncTypes();

export const convertToActionData = (draft: Partial<TTypeDefinition>) => ({
  name: transformLocalizedFieldToLocalizedString(draft.nameAllLocales || []),
  description: transformLocalizedFieldToLocalizedString(
    draft.descriptionAllLocales || []
  ),
  key: draft.key,
  fieldDefinitions: draft.fieldDefinitions?.map((item) => {
    return {
      name: item.name,
      label: transformLocalizedFieldToLocalizedString(
        item.labelAllLocales || []
      ),
    };
  }),
});

export const formValuesToDoc = (formValues: TFormValues) => ({
  name: LocalizedTextInput.omitEmptyTranslations(formValues.name),
  description: LocalizedTextInput.omitEmptyTranslations(formValues.description),
  key: formValues.key,
});

export const useTypeDefinitionCreator = () => {
  const [updateTypeDefinition, { loading }] = useMcMutation<
    TMutation,
    TMutation_CreateTypeDefinitionArgs
  >(CreateTypeDefinitionMutation);

  const execute = async ({ draft }: { draft: TTypeDefinitionDraft }) => {
    try {
      return await updateTypeDefinition({
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
        variables: {
          draft: draft,
        },
      });
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading,
    execute,
  };
};

export const useTypeDefinitionUpdater = () => {
  const [updateTypeDefinitionId, { loading }] = useMcMutation<
    TMutation,
    TMutation_UpdateTypeDefinitionArgs
  >(UpdateTypeDefinitionIdMutation);

  const execute = async ({
    originalDraft,
    nextDraft,
  }: {
    originalDraft: Partial<TTypeDefinition>;
    nextDraft: any;
  }) => {
    try {
      const actions = syncTypes.buildActions(
        nextDraft,
        convertToActionData(originalDraft)
      );
      return await updateTypeDefinitionId({
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
        variables: {
          id: originalDraft.id,
          version: originalDraft.version || 1,
          actions: createGraphQlUpdateActions(actions),
        },
      });
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading,
    execute,
  };
};

export const useTypeDefinitionEntryCreator = () => {
  const [createTypeDefinitionEntry, { loading }] = useMcMutation<
    TMutation,
    TMutation_UpdateTypeDefinitionArgs
  >(UpdateTypeDefinitionIdMutation);

  const execute = async ({
    actions,
    id,
    version,
  }: {
    id: string;
    version: number;
    actions: Array<TTypeUpdateAction>;
  }) => {
    try {
      return await createTypeDefinitionEntry({
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
        variables: {
          id: id,
          version: version || 1,
          actions: actions,
        },
      });
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading,
    execute,
  };
};

type TUseTypeDefinitionFetcher = (props: { id: string }) => {
  typeDefinition?: Maybe<TTypeDefinition>;
  error?: ApolloError;
  loading: boolean;
  refetch: (
    variables?: Partial<TQuery_TypeDefinitionArgs> | undefined
  ) => Promise<ApolloQueryResult<TQuery>>;
};

export const useTypeDefinitionFetcher: TUseTypeDefinitionFetcher = ({ id }) => {
  const { data, error, loading, refetch } = useMcQuery<
    TQuery,
    TQuery_TypeDefinitionArgs
  >(FetchQuery, {
    variables: {
      id: id,
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });
  return {
    typeDefinition: data?.typeDefinition,
    error,
    loading,
    refetch,
  };
};

export type TQuery_TypeDefinitionWithDefinitionByNameArgs = {
  id: string;
  includeNames: Array<string>;
};

export const useTypeWithDefinitionByNameFetcher = (
  id: string,
  includeNames: Array<string>
) => {
  const { data, error, loading, refetch } = useMcQuery<
    TQuery,
    TQuery_TypeDefinitionWithDefinitionByNameArgs
  >(TypeWithDefinitionByName, {
    variables: {
      id: id,
      includeNames: includeNames,
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });
  return {
    fieldDefinitions: data?.typeDefinition?.fieldDefinitions,
    version: data?.typeDefinition?.version,
    error,
    loading,
    refetch,
  };
};

export const useTypeDefinitionDeleter = () => {
  const [deleteTypeDefinitionById, { loading }] = useMcMutation<
    TMutation,
    TMutation_DeleteTypeDefinitionArgs
  >(DeleteQuery);

  const execute = async ({ id, version }: { id: string; version: number }) => {
    try {
      return await deleteTypeDefinitionById({
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
        variables: {
          id: id,
          version: version,
        },
      });
    } catch (graphQlResponse) {
      throw extractErrorFromGraphQlResponse(graphQlResponse);
    }
  };

  return {
    loading,
    execute,
  };
};