/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import React from 'react';

import SharedFromTooltip from '../../../../src/main/resources/META-INF/resources/js/common/components/SharedFromTooltip';

jest.mock('frontend-js-web', () => ({
	sub: (str: string, arg: string) => str.replace('x', arg),
}));

const mockLiferayLanguageGet = jest.fn((key: string) => {
	if (key === 'shared-from-x') {
		return 'Shared from x';
	}

	return key;
});

(global as any).Liferay = {
	Language: {
		get: mockLiferayLanguageGet,
	},
};

describe('SharedFromTooltip', () => {
	it('renders correctly with the provided site name in the tooltip', () => {
		render(<SharedFromTooltip siteName="My Test Site" />);

		const sticker = screen.getByTitle('Shared from "My Test Site"');

		expect(sticker).toBeInTheDocument();
		expect(
			sticker.querySelector('.lexicon-icon-users')
		).toBeInTheDocument();
	});
});
