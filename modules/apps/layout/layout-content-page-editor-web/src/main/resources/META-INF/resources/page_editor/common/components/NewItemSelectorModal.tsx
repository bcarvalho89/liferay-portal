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
import React, {useEffect, useState} from 'react';
import {v4 as uuidv4} from 'uuid';

const OBJECT_ENTRY_FOLDER_CLASS_NAME =
	'com.liferay.object.model.ObjectEntryFolder';

const ROOT_URL = `${window.location.origin}${Liferay.ThemeDisplay.getPathContext()}/o/search/v1.0/search`;

const BASE_SEARCH_PARAMS = {
	emptySearch: 'true',
	nestedFields:
		'description,embedded,file.metadata,file.previewURL,file.thumbnailURL,numberOfObjectEntries,numberOfObjectEntryFolders,systemProperties.objectDefinitionBrief',
};

function getFilterString(cmsSection?: 'contents' | 'files', folderId?: string) {
	if (folderId) {
		return `folderId eq ${folderId}`;
	}

	if (cmsSection) {
		const sectionFilter = `cmsSection eq '${cmsSection}'`;

		return `cmsRoot eq true and ${sectionFilter} and status in (0, 2, 3, 1, 7)`;
	}

	const sectionFilter = "cmsSection in ('contents', 'files')";

	return `cmsRoot eq true and ${sectionFilter} and status in (0, 2, 3, 1, 7)`;
}

function getCMSURL(cmsSection?: 'contents' | 'files', folderId?: string) {
	const contentFilter = getFilterString(cmsSection, folderId);

	const allParams = {
		...BASE_SEARCH_PARAMS,
		currentURL: `/web/cms/${cmsSection || 'contents'}`,
		filter: contentFilter,
	};

	return `${ROOT_URL}?${new URLSearchParams(allParams).toString()}`;
}

type Item = {
	id: string;
	title: string;
};

type NewItemSelectorModalProps = Omit<
	IItemSelectorModalProps<Item>,
	'itemTypeLabel' | 'apiURL'
> & {
	cmsSection?: 'contents' | 'files';
};

const FDS_DEFAULT_PROPS = {
	pagination: {
		deltas: [{label: 20}, {label: 40}, {label: 60}],
		initialDelta: 20,
	},
	selectionType: 'single',
};

function NewItemSelectorModal({
	cmsSection,
	fdsProps,
	...otherProps
}: NewItemSelectorModalProps) {
	const [folderStructure, setFolderStructure] = useState<
		{folderId: string; folderName: string}[]
	>([]);

	const [url, setURL] = useState(() => getCMSURL(cmsSection));

	useEffect(() => {
		setURL(getCMSURL(cmsSection));

		if (!otherProps.open) {
			setFolderStructure([]);
		}
	}, [cmsSection, otherProps.open]);

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

		setURL(getCMSURL(cmsSection, folderId));
	}

	const itemTypeLabel =
		cmsSection === 'files'
			? Liferay.Language.get('files')
			: cmsSection === 'contents'
				? Liferay.Language.get('documents')
				: Liferay.Language.get('files-and-documents');

	return (
		<ItemSelectorModal<Item>
			{...otherProps}
			apiURL={url}
			breadcrumbs={[
				{
					label: Liferay.Language.get('sites-and-libraries'),
					onClick: () => {
						setURL(getCMSURL(cmsSection));
						setFolderStructure([]);
					},
				},
				...folderStructure.map(({folderId, folderName}, index) => ({
					label: folderName,
					onClick: () => {
						setFolderStructure((prevFolderStructure) =>
							prevFolderStructure.slice(0, index + 1)
						);
						setURL(getCMSURL(cmsSection, folderId));
					},
				})),
			]}
			createItemURL={Liferay.ThemeDisplay.getPortalURL()}
			fdsProps={{
				...FDS_DEFAULT_PROPS,
				...fdsProps,
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
				id: `itemSelectorModal-cms-${uuidv4()}`,
				views: [
					{
						contentRenderer: 'cards',
						label: Liferay.Language.get('cards'),
						name: 'cards',
						schema: {
							description: 'embedded.description',
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

							return props;
						},
						thumbnail: 'cards2',
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
