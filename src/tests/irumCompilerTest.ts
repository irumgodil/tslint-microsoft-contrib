import { Utils } from '../utils/Utils';
import { TestHelper } from './TestHelper';
import {
    getFailureStringEmptyAltAndNotEmptyTitle,
    getFailureStringEmptyAltAndNotPresentationRole,
    getFailureStringNoAlt,
    getFailureStringNonEmptyAltAndPresentationRole,
    getFailureStringAltIsImageFileName
} from '../reactA11yImgHasAltRule';

/**
 * Unit test for react-a11y-img-has-alt rule
 */
describe('irumTest', () => {
    const ruleName: string = 'irum-compiler';

    describe('default tests', () => {
        describe('should pass', () => {
            const fileDirectory: string = 'test-data/a11yImgHasAlt/DefaltTests/PassingTestInputs/';

            it('when the element name is not img', () => {
                const fileName: string = fileDirectory + 'ElementNotImg.tsx';
                TestHelper.assertNoViolation(ruleName, fileName);
            });
        });
    });
});
