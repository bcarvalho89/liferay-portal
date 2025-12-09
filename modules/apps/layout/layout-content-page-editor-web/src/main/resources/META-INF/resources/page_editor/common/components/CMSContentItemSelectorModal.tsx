/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import {IView} from '@liferay/frontend-data-set-web';
import {
	IItemSelectorModalProps,
	ItemSelectorModal,
} from '@liferay/frontend-js-item-selector-web';
import React, {useState} from 'react';
import {v4 as uuidv4} from 'uuid';

type Document = {
	contentUrl: string;
	creator: {
		name: string;
	};
	encodingFormat: string;
	fileName: string;
	id: string;
	title: string;
};

type CMSContentItemSelectorModalProps = Omit<
	IItemSelectorModalProps<Document>,
	'itemTypeLabel' | 'fdsProps' | 'apiURL'
> & {
	fdsProps?: IItemSelectorModalProps<Document>['fdsProps'];
};

const OBJECT_ENTRY_FOLDER_CLASS_NAME =
	'com.liferay.object.model.ObjectEntryFolder';

const ROOT_URL = `${window.location.origin}${Liferay.ThemeDisplay.getPathContext()}/o/search/v1.0/search`;

const BASE_SEARCH_PARAMS = {
	currentURL: '/web/cms/contents',
	emptySearch: 'true',
	nestedFields:
		'embedded,file.metadata,file.previewURL,file.thumbnailURL,numberOfObjectEntries,numberOfObjectEntryFolders,systemProperties.objectDefinitionBrief',
};

function getFilterString(folderId?: string) {
	let filter = folderId
		? `folderId eq ${folderId}`
		: "cmsRoot eq true and cmsSection eq 'contents' and status in (0, 2, 3, 1, 7)";

	return filter;
}

function getCMSURL(folderId?: string) {
	const contentFilter = getFilterString(folderId);

	const allParams = {
		...BASE_SEARCH_PARAMS,
		filter: contentFilter,
	};

	return `${ROOT_URL}?${new URLSearchParams(allParams).toString()}`;
}

const documentsItemSelectorConfig = {
	itemTypeLabel: Liferay.Language.get('documents'),
	locator: {
		id: 'embedded.id',
		label: 'embedded.title',
		value: 'embedded.id',
	},

	// views: documentViews,

};

function CMSContentItemSelectorModal({
	allowedFileExtensions,
	fdsProps,
	...otherProps
}: CMSContentItemSelectorModalProps) {
	const [folderStructure, setFolderStructure] = useState<
		{folderId: string; folderName: string}[]
	>([]);
	const [url, setURL] = useState(() => getCMSURL());

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

		setURL(getCMSURL(folderId));
	}

	return (
		<ItemSelectorModal<Document>
			{...otherProps}
			apiURL={url}
			breadcrumbs={
				folderStructure.length
					? [
							{
								label: Liferay.Language.get('default'),
								onClick: () => {
									setURL(getCMSURL());
									setFolderStructure([]);
								},
							},
							...folderStructure.map(
								({folderId, folderName}, index) => ({
									label: folderName,
									onClick: () => {
										setFolderStructure(
											(prevFolderStructure) =>
												prevFolderStructure.slice(
													0,
													index + 1
												)
										);
										setURL(getCMSURL(folderId));
									},
								})
							),
						]
					: undefined
			}
			createItemURL={Liferay.ThemeDisplay.getPortalURL()}
			fdsProps={{
				pagination: {
					deltas: [{label: 20}, {label: 40}, {label: 60}],
					initialDelta: 20,
				},
				selectionType: 'single',
				id: `itemSelectorModal-documents-${uuidv4()}`,

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
							name: 'cmsContentTitleCellRenderer',
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

				views: [
					{
						contentRenderer: 'cards',
						label: Liferay.Language.get('cards'),
						name: 'cards',
						schema: {
							description: 'description',
							image: 'contentUrl',
							title: 'title',
						},
						setItemComponentProps: ({
							item,
							props,
						}: {
							item: any;
							props: any;
						}) => {
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

							const stickerProps = {
								className: 'file-icon-color-5',
								displayType: 'unstyled',
							};

							if (
								!(item?.encodingFormat || '').startsWith(
									'image'
								)
							) {
								return {
									...props,
									imgProps: null,
									stickerProps,
								};
							}

							return {
								...props,
								stickerProps,
							};
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
									fieldName: 'title',
									label: Liferay.Language.get('title'),
									sortable: false,
								},
								{
									fieldName: 'description',
									label: Liferay.Language.get('description'),
									sortable: false,
								},
								{
									fieldName: 'fileName',
									label: Liferay.Language.get('fileName'),
									sortable: false,
								},
								{
									fieldName: 'fileExtension',
									label: Liferay.Language.get('type'),
									sortable: false,
								},
							],
						},
						thumbnail: 'table',
					},
				],
			}}
			itemTypeLabel={documentsItemSelectorConfig.itemTypeLabel}
			locator={documentsItemSelectorConfig.locator}
		/>
	);
}

export default CMSContentItemSelectorModal;
