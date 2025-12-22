/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import ClaySticker from '@clayui/sticker';
import {ClayTooltipProvider} from '@clayui/tooltip';
import {sub} from 'frontend-js-web';
import React from 'react';

interface SharedFromTooltipProps {
	siteName: string;
}

export default function SharedFromTooltip({siteName}: SharedFromTooltipProps) {
	return (
		<ClayTooltipProvider>
			<ClaySticker
				className="flex-shrink-0"
				data-tooltip-align="top"
				displayType="unstyled"
				title={sub(
					Liferay.Language.get('shared-from-x'),
					`"${siteName}"`
				)}
			>
				<ClayIcon className="text-secondary" symbol="users" />
			</ClaySticker>
		</ClayTooltipProvider>
	);
}
