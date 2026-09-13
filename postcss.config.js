export default {
  plugins: {
    'postcss-rem-to-responsive-pixel': {
      rootValue: 16,
      propList: ['*'],
      transformUnit: 'px',
    },
  },
};