/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayLink from '@clayui/link';
import {openModal} from 'frontend-js-components-web';
import React from 'react';

import SpaceMembersModalContent from '../spaces/SpaceMembersModal';

enum SpaceAbstractHeaderActions {
	OPEN_MEMBERS_MODAL = 'open-members-modal',
}

type ModalPropsType = {
	action: SpaceAbstractHeaderActions;
	assetLibraryCreatorUserId: string;
	assetLibraryId: string;
};

interface SpaceAbstractHeaderProps {
	label: string;
	modalProps?: ModalPropsType;
	title: string;
	url: string;
}

export default function SpaceAbstractHeader({
	label,
	modalProps,
	title,
	url,
}: SpaceAbstractHeaderProps) {
	const openMembersModal = (props: ModalPropsType) => {
		openModal({
			center: true,
			contentComponent: () =>
				SpaceMembersModalContent({
					assetLibraryCreatorUserId: props.assetLibraryCreatorUserId,
					assetLibraryId: props.assetLibraryId,
				}),
			size: 'md',
			title,
		});
	};

	const getActionCallback = () => {
		if (
			modalProps?.action === SpaceAbstractHeaderActions.OPEN_MEMBERS_MODAL
		) {
			return openMembersModal(modalProps);
		}
	};

	return (
		<div className="align-items-center d-flex justify-content-between">
			<h2 className="font-weight-semi-bold m-0 text-4">{title}</h2>

			{modalProps ? (
				<ClayButton
					displayType="link"
					onClick={getActionCallback}
					size="sm"
				>
					{label}
				</ClayButton>
			) : (
				<ClayLink href={url}>{label}</ClayLink>
			)}
		</div>
	);
}
