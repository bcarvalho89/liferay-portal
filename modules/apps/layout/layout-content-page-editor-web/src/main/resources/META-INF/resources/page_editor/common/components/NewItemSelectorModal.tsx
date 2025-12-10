/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
import ClayButton from '@clayui/button';
import ClayForm, {ClaySelectWithOption} from '@clayui/form';
import {IView} from '@liferay/frontend-data-set-web';
import {
	IItemSelectorModalProps,
	ItemSelectorModal,
} from '@liferay/frontend-js-item-selector-web';
import React, {useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';
import {openToast} from 'frontend-js-components-web';

const CONTENT_SOURCE = {
	CMS_CONTENTS: 'contents',
	CMS_FILES: 'files',
	DXP: 'dpx',
} as const;

type ContentSource = (typeof CONTENT_SOURCE)[keyof typeof CONTENT_SOURCE];

const OBJECT_ENTRY_FOLDER_CLASS_NAME =
	'com.liferay.object.model.ObjectEntryFolder';

const ROOT_URL = `${window.location.origin}${Liferay.ThemeDisplay.getPathContext()}/o/search/v1.0/search`;

const BASE_SEARCH_PARAMS = {
	emptySearch: 'true',
	nestedFields:
		'description,embedded,embedded.contentUrl,file.metadata,file.previewURL,file.thumbnailURL,numberOfObjectEntries,numberOfObjectEntryFolders,systemProperties.objectDefinitionBrief',
};

function getFilterString(source?: ContentSource, folderId?: string) {
	if (folderId) {
		return `folderId eq ${folderId}`;
	}

	if (
		source === CONTENT_SOURCE.CMS_CONTENTS ||
		source === CONTENT_SOURCE.CMS_FILES
	) {
		const sectionFilter = `cmsSection eq '${source}'`;

		return `cmsRoot eq true and ${sectionFilter} and status in (0, 2, 3, 1, 7)`;
	}

	return `status in (0, 2, 3, 1, 7)`;
}

function getCMSURL(source?: ContentSource, folderId?: string) {
	const contentFilter = getFilterString(source, folderId);

	const allParams = {
		...BASE_SEARCH_PARAMS,
		filter: contentFilter,
	};

	return `${ROOT_URL}?${new URLSearchParams(allParams).toString()}`;
}

type CMSItem = {
	entryClassName: string;
	embedded: {
		id: string;
		title: string;
		description: string;
		scopeKey?: string;
		contentUrl?: string;
		file?: {
			id: string;
			link: string;
			thumbnailURL: string;
			mimeType: string;
			name: string;
		};
	};
};

type NewItemSelectorModalProps = Omit<
	IItemSelectorModalProps<CMSItem>,
	'itemTypeLabel' | 'apiURL'
> & {
	onUploadFile?: (
		file: File,
		groupId: string,
		folderId: string
	) => Promise<any>;
};

const FDS_DEFAULT_PROPS = {
	pagination: {
		deltas: [{label: 20}, {label: 40}, {label: 60}],
		initialDelta: 20,
	},
	selectionType: 'single',
};

function NewItemSelectorModal({
	fdsProps,
	onUploadFile,
	...otherProps
}: NewItemSelectorModalProps) {
	const [selectorSource, setSelectorSource] = useState<ContentSource>(
		CONTENT_SOURCE.DXP
	);
	const [folderStructure, setFolderStructure] = useState<
		{folderId: string; folderName: string}[]
	>([]);

	const url = getCMSURL(selectorSource, folderStructure.at(-1)?.folderId);

	useEffect(() => {
		if (!otherProps.open) {
			setFolderStructure([]);
		}
	}, [otherProps.open]);

	function onChildFolderClick({
		folderId,
		folderName,
	}: {
		folderId: string;
		folderName: string;
	}) {
		setFolderStructure((prevStructure) => [
			...prevStructure,
			{folderId, folderName},
		]);
	}

	const itemTypeLabel =
		selectorSource === CONTENT_SOURCE.CMS_FILES
			? Liferay.Language.get('files')
			: selectorSource === CONTENT_SOURCE.CMS_CONTENTS
				? Liferay.Language.get('documents')
				: 'All DXP Documents';

	return (
		<ItemSelectorModal<CMSItem>
			{...otherProps}
			key={selectorSource}
			apiURL={url}
			message={
				<div className="container-fluid">
					<ClayForm.Group>
						<label htmlFor="source-selector">
							{Liferay.Language.get('source')}
						</label>

						<ClaySelectWithOption
							id="source-selector"
							onChange={(event) => {
								setFolderStructure([]);
								setSelectorSource(
									event.target.value as ContentSource
								);
							}}
							options={[
								{
									label: Liferay.Language.get('files'),
									value: CONTENT_SOURCE.CMS_FILES,
								},
								{
									label: Liferay.Language.get('contents'),
									value: CONTENT_SOURCE.CMS_CONTENTS,
								},
								{
									label: Liferay.Language.get(
										'All DXP Documents'
									),
									value: CONTENT_SOURCE.DXP,
								},
							]}
							value={selectorSource}
						/>
					</ClayForm.Group>
				</div>
			}
			breadcrumbs={[
				{
					label: Liferay.Language.get('sites-and-libraries'),
					onClick: () => {
						setFolderStructure([]);
					},
				},
				...folderStructure.map(({folderId, folderName}, index) => ({
					label: folderName,
					onClick: () => {
						setFolderStructure((prevFolderStructure) =>
							prevFolderStructure.slice(0, index + 1)
						);
					},
				})),
			]}
			fdsProps={{
				...FDS_DEFAULT_PROPS,
				...fdsProps,
				fileDropSettings:
					onUploadFile &&
					selectorSource !== CONTENT_SOURCE.CMS_CONTENTS
						? {
								enabled: true,
								isDropTarget: ({item}: {item: any}) => {
									return item.entryClassName.includes(
										OBJECT_ENTRY_FOLDER_CLASS_NAME
									);
								},
								onFileDrop: (
									files: File[],
									dropTarget?: any
								) => {
									const targetGroupId = String(
										dropTarget?.embedded?.scopeId ||
											Liferay.ThemeDisplay.getScopeGroupId()
									);
									const targetFolderId =
										dropTarget?.embedded?.id || '0';

									files.forEach(async (file) => {
										try {
											await onUploadFile(
												file,
												targetGroupId,
												targetFolderId
											);

											openToast({
												message: Liferay.Language.get(
													'file-uploaded-successfully'
												),
												type: 'success',
											});
										}
										catch (error) {
											console.error(error);
											openToast({
												message: Liferay.Language.get(
													'an-unexpected-error-occurred'
												),
												type: 'danger',
											});
										}
									});
								},
							}
						: undefined,
				customRenderers: {
					tableCell: [
						{
							component: ({itemData, value}) => {
								const {embedded, entryClassName} = itemData;

								return entryClassName ===
									OBJECT_ENTRY_FOLDER_CLASS_NAME ? (
									<ClayButton
										className="c-p-0"
										displayType="link"
										onClick={() => {
											onChildFolderClick({
												folderId: embedded.id,
												folderName: embedded.title,
											});
										}}
									>
										{value}
									</ClayButton>
								) : (
									value
								);
							},
							name: 'cmsTitleCellRenderer',
							type: 'internal',
						},
					],
				},
				filters: [
					{
						apiURL: '/o/headless-asset-library/v1.0/asset-libraries',
						entityFieldType: 'collection',
						id: 'groupIds',
						itemKey: 'siteId',
						itemLabel: 'name',
						label: Liferay.Language.get('space'),
						multiple: true,
						type: 'selection',
					},
				],
				id: `itemSelectorModal-${uuidv4()}`,
				views: [
					{
						contentRenderer: 'cards',
						label: Liferay.Language.get('cards'),
						name: 'cards',
						schema: {
							description: 'embedded.description',
							labels: [{value: 'embedded.scopeKey'}],
							image: 'embedded.file.thumbnailURL',
							title: 'embedded.title',
						},
						setItemComponentProps: ({item, props}) => {
							if (
								item.entryClassName ===
								OBJECT_ENTRY_FOLDER_CLASS_NAME
							) {
								return {
									...props,
									onClick: () => {
										onChildFolderClick({
											folderId: item.embedded.id,
											folderName: item.embedded.title,
										});
									},
									onSelectChange: null,
									symbol: 'folder',
								};
							}

							const updatedProps = {...props};
							const updatedLabels = [];

							if (item.embedded?.scopeKey) {
								updatedLabels.push({
									displayType: 'secondary',
									value: item.embedded.scopeKey,
								});
							}
							else {
								updatedLabels.push({
									displayType: 'secondary',
									value: 'Under DXP Documents',
								});
							}
							updatedProps.labels = updatedLabels;

							if (item.embedded?.contentUrl) {
								const url =
									item.embedded.contentUrl.split(
										'&download=true'
									);
								updatedProps.image = url[0];
								updatedProps.imgProps = {
									alt: '',
									src: url[0],
								};
							}
							else if (item.embedded?.file?.thumbnailURL) {
								updatedProps.image =
									item.embedded.file.thumbnailURL;
							}

							if (item.embedded?.title) {
								updatedProps.title = item.embedded.title;
							}
							else {
								updatedProps.title = item.title;
							}

							return updatedProps;
						},
						thumbnail: 'cards2',
					},
					{
						contentRenderer: 'table',
						label: Liferay.Language.get('table'),
						name: 'table',
						schema: {
							fields: [
								{
									contentRenderer: 'cmsTitleCellRenderer',
									fieldName: 'embedded.title',
									label: Liferay.Language.get('title'),
								},
								{
									fieldName: 'embedded.description',
									label: Liferay.Language.get('description'),
								},
								{
									fieldName: 'embedded.file.name',
									label: Liferay.Language.get('file-name'),
								},
							],
						},
						setItemComponentProps: ({item, props}) => {
							if (
								item.entryClassName ===
								OBJECT_ENTRY_FOLDER_CLASS_NAME
							) {
								return {
									...props,
									onClick: (e: {
										preventDefault: () => void;
									}) => {
										e.preventDefault();
									},
									onSelectChange: null,
								};
							}
							const newItems = props.items.filter(
								(field: any) => field.fieldName !== 'select'
							);

							if (item.embedded?.scopeKey) {
								newItems.push({
									fieldName: 'embedded.scopeKey',
									label: Liferay.Language.get('space'),
								});
							}
							else {
								newItems.push({
									fieldName: 'embedded.scopeKey',
									label: Liferay.Language.get('scope'),
								});
							}

							return props;
						},
						thumbnail: 'table',
					},
				] as IView[],
			}}
			itemTypeLabel={itemTypeLabel}
			locator={{
				id: 'embedded.id',
				label: 'embedded.title',
				value: 'embedded.id',
			}}
		/>
	);
}

export default NewItemSelectorModal;
