import composeSourcemaps from './utils/compose-sourcemaps'
import { createOutput } from './transformer'
import panic from './utils/panic'

export const postprocessors = new Set()

/**
 * Register a postprocessor that will be used after the parsing and compilation of the riot tags
 * @param { Function } postprocessor - transformer that will receive the output code ans sourcemap
 * @returns { Set } the postprocessors collection
 */
export function register(postprocessor) {
  if (postprocessors.has(postprocessor)) {
    panic(`This postprocessor "${postprocessor.name || postprocessor.toString()}" was already registered`)
  }

  postprocessors.add(postprocessor)

  return postprocessors
}

/**
 * Unregister a postprocessor
 * @param { Function } postprocessor - possibly a postprocessor previously registered
 * @returns { Set } the postprocessors collection
 */
export function unregister(postprocessor) {
  if (!postprocessors.has(postprocessor)) {
    panic(`This postprocessor "${postprocessor.name || postprocessor.toString()}" was never registered`)
  }

  postprocessors.delete(postprocessor)

  return postprocessors
}

/**
 * Exec all the postprocessors in sequence combining the sourcemaps generated
 * @param   { Output } compilerOutput - output generated by the compiler
 * @param   { Object } meta - compiling meta information
 * @returns { Output } object containing output code and source map
 */
export function execute(compilerOutput, meta) {
  return Array.from(postprocessors).reduce(function(acc, postprocessor) {
    const { code, map } = acc
    const output = postprocessor(code, meta)

    return {
      code: output.code,
      map: composeSourcemaps(map, output.map)
    }
  }, createOutput(compilerOutput, meta))
}