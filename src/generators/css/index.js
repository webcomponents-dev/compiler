import {builders, types} from '../../utils/build-types'
import {TAG_CSS_PROPERTY} from '../constants'
import getPreprocessorTypeByAttribute from '../../utils/get-preprocessor-type-by-attribute'
import preprocess from '../../utils/preprocess-node'

/**
 * Source for creating regexes matching valid quoted, single-line JavaScript strings.
 * It recognizes escape characters, including nested quotes and line continuation.
 * @const {string}
 */
const S_LINESTR = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source

/**
 * Matches CSS selectors, excluding those beginning with '@' and quoted strings.
 * @const {RegExp}
 */

const CSS_SELECTOR = RegExp(`([{}]|^)[; ]*((?:[^@ ;{}][^{}]*)?[^@ ;{}:] ?)(?={)|${S_LINESTR}`, 'g')

/**
 * Parses styles enclosed in a "scoped" tag
 * The "css" string is received without comments or surrounding spaces.
 *
 * @param   {string} tag - Tag name of the root element
 * @param   {string} css - The CSS code
 * @returns {string} CSS with the styles scoped to the root element
 */
function scopedCSS(tag, css) {
  const host = ':host'
  const selectorsBlacklist = ['from', 'to']

  return css.replace(CSS_SELECTOR, function(m, p1, p2) {
    // skip quoted strings
    if (!p2) return m

    // we have a selector list, parse each individually
    p2 = p2.replace(/[^,]+/g, function(sel) {
      const s = sel.trim()

      // skip selectors already using the tag name
      if (s.indexOf(tag) === 0) {
        return sel
      }

      // skips the keywords and percents of css animations
      if (!s || selectorsBlacklist.indexOf(s) > -1 || s.slice(-1) === '%') {
        return sel
      }

      // replace the `:host` pseudo-selector, where it is, with the root tag name;
      // if `:host` was not included, add the tag name as prefix, and mirror all
      // `[data-is]`
      if (s.indexOf(host) < 0) {
        return `${tag} ${s},[is="${tag}"] ${s}`
      } else {
        return `${s.replace(host, tag)},${
          s.replace(host, `[is="${tag}"]`)}`
      }
    })

    // add the danling bracket char and return the processed selector list
    return p1 ? `${p1} ${p2}` : p2
  })
}

/**
 * Generate the component css
 * @param   { Object } sourceNode - node generated by the riot compiler
 * @param   { string } source - original component source code
 * @param   { Object } meta - compilation meta information
 * @param   { AST } ast - current AST output
 * @returns { AST } the AST generated
 */
export default function css(sourceNode, source, meta, ast) {
  const preprocessorName = getPreprocessorTypeByAttribute(sourceNode)
  const { options } = meta
  const cssNode = sourceNode.text
  const preprocessorOutput = preprocess('css', preprocessorName, meta, source, cssNode)
  const cssCode = (options.scopedCss ?
    scopedCSS(meta.tagName, preprocessorOutput.code) :
    preprocessorOutput.code
  ).trim()

  types.visit(ast, {
    visitProperty(path) {
      if (path.value.key.value === TAG_CSS_PROPERTY) {
        path.value.value = builders.templateLiteral(
          [builders.templateElement({ raw: cssCode, cooked: '' }, false)],
          []
        )

        return false
      }

      this.traverse(path)
    }
  })

  return ast
}