/** 
* @typedef {Object} Project
* @property {string} id
* @property {string} title
* @property {string} [summary]
* @property {string} [thumbnail]
*/


/** 공통 섹션 속성 */
/** 
* @typedef {Object} BaseSection
* @property {string} id
* @property {string} title
*/


/** @typedef {"hero"|"cards"|"text"|"list"|"form"} SectionType */
/** @typedef {BaseSection & { type:"hero", content?:string, cta?:{label:string, href:string} }} HeroSection */
/** @typedef {BaseSection & { type:"cards", items:{title:string, text?:string}[] }} CardsSection */
/** @typedef {BaseSection & { type:"text", content:string }} TextSection */
/** @typedef {BaseSection & { type:"list", items:string[] }} ListSection */
/** @typedef {BaseSection & { type:"form" }} FormSection */
/** @typedef {HeroSection|CardsSection|TextSection|ListSection|FormSection} Section */


/** 
* @typedef {Object} Page
* @property {string} path
* @property {string} label
* @property {Section[]} sections
*/