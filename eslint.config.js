// The anti-slop guardrail (DESIGN.md §9): screens compose primitives;
// tokens live only in core/design/. Outside core/design/, CI fails on
// literal hex colors, ad-hoc type/spacing numbers, and inline style
// objects. An eslint-disable here is a design decision — it must carry a
// justification and gets flagged to Kari in review.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const AD_HOC_STYLE_NUMBER =
  /^(fontSize|lineHeight|letterSpacing|gap|rowGap|columnGap|borderRadius|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical)$/
    .source;

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.expo/**', 'mockserver/**', 'core/api/schema.d.ts']
  },
  {
    files: ['core/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'shells/**/*.{ts,tsx}'],
    ignores: ['core/design/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Literal color — colors live in core/design/tokens.ts only.'
        },
        {
          selector: 'Literal[value=/^(rgb|rgba|hsl|oklch)\\(/]',
          message: 'Literal color — colors live in core/design/tokens.ts only.'
        },
        {
          selector: `Property[key.name=${JSON.stringify(AD_HOC_STYLE_NUMBER)}][value.type='Literal']`,
          message:
            'Ad-hoc type/spacing number — use core/design tokens, or extend a primitive (a design decision, flagged to Kari).'
        },
        {
          selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
          message:
            'Inline style object — screens compose primitives from core/design; extend the primitive instead.'
        }
      ]
    }
  }
]);
