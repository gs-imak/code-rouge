// Image imports. Metro resolves `import x from './y.png'` to a numeric asset id
// (valid as a React Native <Image source>); the web harness (vite) resolves it to
// a URL string, which react-native-web's <Image> also accepts.
declare module '*.png' {
  const value: number
  export default value
}
