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

const CMS_SECTION = {
	CONTENTS: 'contents',
	FILES: 'files',
} as const;

type CMSSection = (typeof CMS_SECTION)[keyof typeof CMS_SECTION];

const OBJECT_ENTRY_FOLDER_CLASS_NAME =
	'com.liferay.object.model.ObjectEntryFolder';

const ROOT_URL = `${window.location.origin}${Liferay.ThemeDisplay.getPathContext()}/o/search/v1.0/search`;

const BASE_SEARCH_PARAMS = {
	emptySearch: 'true',
	nestedFields:
		'description,embedded,file.metadata,file.previewURL,file.thumbnailURL,numberOfObjectEntries,numberOfObjectEntryFolders,systemProperties.objectDefinitionBrief',
};

function getFilterString(cmsSection?: CMSSection, folderId?: string) {
	if (folderId) {
		return `folderId eq ${folderId}`;
	}

	if (cmsSection) {
		const sectionFilter = `cmsSection eq '${cmsSection}'`;

		return `cmsRoot eq true and ${sectionFilter} and status in (0, 2, 3, 1, 7)`;
	}

	return `cmsRoot eq true and cmsSection in ('contents', 'files') and status in (0, 2, 3, 1, 7)`;
}

function getCMSURL(cmsSection?: CMSSection, folderId?: string) {
	const contentFilter = getFilterString(cmsSection, folderId);

	const allParams = {
		...BASE_SEARCH_PARAMS,
		currentURL: `/web/cms/${cmsSection || 'files'}`,
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
	onUploadFile?: (file: File) => Promise<any>;
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
	const [cmsSection, setCMSSection] = useState<CMSSection>(CMS_SECTION.FILES);
	const [folderStructure, setFolderStructure] = useState<
		{folderId: string; folderName: string}[]
	>([]);

	const url = getCMSURL(cmsSection, folderStructure.at(-1)?.folderId);

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
		cmsSection === CMS_SECTION.FILES
			? Liferay.Language.get('files')
			: cmsSection === CMS_SECTION.CONTENTS
				? Liferay.Language.get('documents')
				: Liferay.Language.get('files-and-documents');

	return (
		<ItemSelectorModal<CMSItem>
			{...otherProps}
			key={cmsSection}
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
								setCMSSection(event.target.value as CMSSection);
							}}
							options={[
								{
									label: Liferay.Language.get('files'),
									value: CMS_SECTION.FILES,
								},
								{
									label: Liferay.Language.get('contents'),
									value: CMS_SECTION.CONTENTS,
								},
							]}
							value={cmsSection}
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
			createItemURL={Liferay.ThemeDisplay.getPortalURL()}
			fdsProps={{
				...FDS_DEFAULT_PROPS,
				...fdsProps,
				fileDropSettings:
					onUploadFile && cmsSection === CMS_SECTION.FILES
						? {
								enabled: true,
								onFileDrop: (files: File[]) => {
									files.forEach(async (file) => {
										try {
											await onUploadFile(file);

											openToast({
												message: Liferay.Language.get(
													'file-uploaded-successfully'
												),
												type: 'success',
											});
										}
										catch (error) {
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
				id: `itemSelectorModal-cms-${uuidv4()}`,
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

							const spaceLabel = {
								displayType: 'secondary',
								value: item.embedded.scopeKey || '',
							};

							return {...props, labels: [spaceLabel]};
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
								{
									fieldName: 'embedded.scopeKey',
									label: Liferay.Language.get('space'),
								},
							],
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
