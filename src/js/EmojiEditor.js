import $ from "jquery";
import Converters from "./Converters";

"use strict";

export default class EmojiEditor {

    /**
     *
     * @param {HTMLElement|HTMLTextAreaElement|HTMLInputElement} input
     * @param {Boolean} prevent_new_line
     * @param {String} save_html_as
     */
    constructor(input, prevent_new_line = false, save_html_as = 'utf8') {
        /**
         *
         * @type {HTMLElement|HTMLTextAreaElement|HTMLInputElement}
         * @private
         */
        this._input = input;

        /**
         * @type {Boolean}
         * @private
         */
        this._is_content_editable = this.isContentEditable(input);

        /**
         *
         * @type {Range|undefined}
         */
        this.cursor_position = undefined;

        /**
         *
         * @type {boolean}
         */
        this.prevent_new_line = prevent_new_line;

        this.save_html_as = save_html_as;

        this._trackCursor();
        this._onPaste();
    }

    /**
     * Check if an input element is contenteditable.
     *
     * (IE11 marks textareas as contenteditable (!))
     * @param {HTMLElement|HTMLTextAreaElement|HTMLInputElement} element
     */
    isContentEditable(element) {
        const tag = element.nodeName
        return element.isContentEditable && tag !== "INPUT" && tag !== "TEXTAREA"
    }

    /**
     * Pastes an emoji at the caret taking into account whether the element
     * is contenteditable or not.
     *
     * @param {Emoji} emoji
     */
    placeEmoji(emoji) {
        this._input.focus();
        if (this.cursor_position) {
            EmojiEditor.restoreSelection(this.cursor_position);
        }

        if (this._is_content_editable) {
            let node;
            if (EmojiEditor.supportsUnified()) {
                node = EmojiEditor.pasteTextAtCaret(emoji.getCharacter());
                EmojiEditor.selectElement(node);
                this.cursor_position = EmojiEditor.saveSelection();
            } else {
                node = EmojiEditor.pasteHtml(emoji.getHtml());
                this.cursor_position = EmojiEditor.saveSelection();
            }

            $(this._input).trigger('change').trigger('input');

            return node;
        }

        const text = this.pasteInputText(emoji.getColons());
        $(this._input).trigger('change').trigger('input'); //triggers change & input events since we're doing this manually
        return text;
    }


    /**
     * Pastes text at the cursor while preserving cursor position.
     *
     * @param text
     * @return {String}
     */
    pasteInputText(text) {

        const cursor_position = this._input.selectionStart;
        const current_length = this._input.value.length;
        this._input.value = this._input.value.substr(0, cursor_position)
            + text
            + this._input.value.substr(cursor_position);

        this.setInputCaretPosition(cursor_position + this._input.value.length - current_length);

        return text;
    }

    /**
     * Sets the caret position on a textarea or input[type=text] field
     *
     *
     * @param position
     * @returns {boolean}
     */
    setInputCaretPosition(position) {
        if (this._input.createTextRange) {
            const range = this._input.createTextRange();
            range.move('character', position);
            range.select();
            return true;
        } else {
            if (this._input.selectionStart || this._input.selectionStart === 0) {
                this._input.focus();
                this._input.setSelectionRange(position, position);
                return true;
            }
            //Otherwise this method failed (browser not supported)
            else {
                this._input.focus();
                return false;
            }
        }
    }

    /**
     * Gets the text from the input
     *
     * @returns {*}
     */
    getText() {
        if (this._is_content_editable) {
            return this._mapElement(this._input)
                .replace(/[\u200B-\u200D\uFEFF]/g, '');
        }

        return Converters.withUnified().replace_colons(this._input.value);
    }

    /**
     * Gets the text from the input
     *
     * @returns {*}
     */
    getHtml() {
        if (this._is_content_editable) {
            return this._mapElementHtml(this._input)
                .replace(/[\u200B-\u200D\uFEFF]/g, '');
        }

        return Converters.withUnified().replace_colons(this._input.value);
    }

    /**
     * Empty the input's contents.
     */
    empty() {
        if (this._is_content_editable) {
            this._input.innerHTML = "";
        } else {
            this._input.value = "";
        }
    }

    /**
     * Intercepts paste events for contenteditable divs so that we don't get
     * any of the special html that gets inserted automatically.
     *
     * @returns {EmojiEditor}
     * @private
     */
    _onPaste() {
        if (this._is_content_editable) {
            $(this._input).off('paste.editable').on('paste.editable', event => {
                event.stopPropagation();
                event.preventDefault();

                const clipboard_data = event.originalEvent.clipboardData || window.clipboardData;
                const pasted_data = clipboard_data.getData('text');
                const text = EmojiEditor.pasteTextAtCaret(pasted_data);
                EmojiEditor.selectElement(text);
            });
        }

        return this;
    }

    /**
     * Get all of the child nodes in an input
     *
     * @returns {Array<Node>}
     */
    getNodes() {
        return Array.prototype.slice.call(this._input.childNodes);
    }

    /**
     * Selects the last node in the input.
     */
    selectLastNode() {
        const nodes = this.getNodes();
        if (nodes.length) {
            EmojiEditor.selectElement(nodes[nodes.length - 1]);
            this.cursor_position = EmojiEditor.saveSelection();
        }
    }

    /**
     * Extracts just text and emojis from a contenteditable element
     *
     * @param {HTMLElement} el
     * @private
     */
    _mapElement(el) {

        const children = Array.prototype.slice.call(el.childNodes);

        return children.map(/**Text|HTMLElement*/node => {

            const is_text = node instanceof Text;
            const is_html = node instanceof HTMLElement;

            //Return all text from text nodes
            if (is_text) {
                return node.textContent;
            }
            //Extract codepoints from span
            else if (is_html && node.tagName === "SPAN") {
                return EmojiEditor._extractSpan(node);
            }

            //Extract codepoints from an image if it was supplied
            else if (is_html && node.tagName === "IMG") {
                return EmojiEditor._extractImage(node);
            }

            //Convert br tags to line breaks
            else if (is_html && node.tagName === "BR") {
                return "\n";
            }

            //if the element is not html we're accounting for run it back through this function
            else if (is_html) {
                return this._mapElement(node);
            } else {
                //Unaccounted for situation - just return a blank string
                return "";
            }
        }).join("");
    }

    /**
     * Extracts just html and emojis from a contenteditable element
     *
     * @param {HTMLElement} el
     * @private
     */
    _mapElementHtml(el) {
        if (this.save_html_as === 'html') {
            return el.innerHTML;
        }
        const children = Array.prototype.slice.call(el.childNodes);

        return children.map(/**Text|HTMLElement*/node => {

            const is_text = node instanceof Text;
            const is_html = node instanceof HTMLElement;

            //Return all text from text nodes
            if (is_text) {
                return node.textContent;
            }
            //Extract codepoints from span
            else if (is_html && node.tagName === "SPAN") {
                return EmojiEditor._extractSpan(node, true, this.save_html_as);
            }

            //Extract codepoints from an image if it was supplied
            else if (is_html && node.tagName === "IMG") {
                return EmojiEditor._extractImage(node, true, this.save_html_as);
            }

            //Convert script tags to empty string
            else if (is_html && node.tagName === "SCRIPT") {
                return "";
            }
            //Convert style tags to empty string
            else if (is_html && node.tagName === "STYLE") {
                return "";
            }
            //Convert link tags to empty string
            else if (is_html && node.tagName === "LINK") {
                return "";
            }

            //if the element is not html we're accounting for run it back through this function
            else if (is_html) {
                return node.outerHTML;
            } else {
                //Unaccounted for situation - just return a blank string
                return "";
            }
        }).join("");
    }

    /**
     * Tracks the cursor position and monitors the enter button in case prevent_new_line is true
     *
     * @returns {EmojiEditor}
     * @private
     */
    _trackCursor() {
        if (this._is_content_editable) {
            $(this._input).off('keyup.emoji mouseup.emoji').on('keyup.emoji mouseup.emoji', () => {
                this.cursor_position = EmojiEditor.saveSelection();
            });

            $(this._input).off('keydown.emoji').on('keydown.emoji', event => {
                if (event.which === 13 && this.prevent_new_line) {
                    event.preventDefault();
                }
            });
        }

        return this;
    }

    /**
     * Extracts the text content from a contenteditable and extracts any spans.
     *
     * @param span
     * @param gettingHtml
     * @param saveHtmlAs
     * @returns {String}
     * @private
     */
    static _extractSpan(span, gettingHtml = false, saveHtmlAs = 'utf8') {
        const $span = $(span);
        const $inner = $span.find('.emoji-inner');
        //If the span was not inserted by the emoji picker
        if (!$inner.length && !gettingHtml) {
            return "";
        } else if (!$inner.length && gettingHtml) {
            return span.outerHTML;
        }
        //If the span was inserted by the emoji picker, get the codepoints and return the corresponding character
        try {
            const codepoint = $inner.data('codepoints');
            return EmojiEditor.parseCodepoints(codepoint, gettingHtml, saveHtmlAs);
        } catch (err) {
            return "";
        }
    }

    /**
     * Extracts codepoints from an image if it exists.
     *
     * @param {HTMLElement} img
     * @param gettingHtml
     * @param saveHtmlAs
     * @private
     */
    static _extractImage(img, gettingHtml = false, saveHtmlAs = 'utf8') {
        if (img.hasAttribute('data-codepoints')) {
            return EmojiEditor.parseCodepoints(
                img.getAttribute('data-codepoints'),
                gettingHtml,
                saveHtmlAs
            );
        }
        if (gettingHtml) {
            return img.outerHTML
        }

        return "";
    }

    /**
     * Parses codepoints that may come in the format
     * `hex`-`hex` rather than just `hex`
     *
     * @param codepoints
     * @param gettingHtml
     * @param saveHtmlAs
     * @returns {*}
     */
    static parseCodepoints(codepoints, gettingHtml = false, saveHtmlAs = 'utf8') {
        let emojiUtf8;
        if (/-/g.test(codepoints)) {
            const arr = codepoints.split("-");
            const one = `0x${arr[0]}`;
            const two = `0x${arr[1]}`;
            emojiUtf8 = String.fromCodePoint(one, two);
            codepoints = one || two;
        } else {
            emojiUtf8 = String.fromCodePoint(`0x${codepoints}`);
        }
        if (!gettingHtml || saveHtmlAs == 'utf8') return emojiUtf8;
        if (saveHtmlAs == 'img') {
            return `<img class="emoji-img" src="http://emojistatic.github.io/images/64/${codepoints}.png" style="width:1.2em;height:1.2em;font-size:1.2em;vertical-align:text-bottom;" alt="${emojiUtf8}">`
        }
    }

    /**
     * Replaces unified unicode inside of a contenteditable element with
     * platform appropriate content.
     *
     */
    replaceUnified() {

        if (this._is_content_editable) {
            const converter = Converters.withEnvironment();
            const html = converter.replace_unified(this._input.innerHTML);
            EmojiEditor.selectElementContents(this._input);
            const node = EmojiEditor.pasteHtml(html);
            if (node) {
                EmojiEditor.selectElement(node);
            }
        } else {
            throw new Error("The replaceUnified method should only be called on contenteditable elements.");
        }

    }


    /**
     * Determines if the environment supports unified unicode.
     *
     * @returns {boolean}
     */
    static supportsUnified() {
        return Converters.withEnvironment().replace_mode === "unified";
    }

    /**
     * Shortcut to paste html at the caret with a dummy unicode character.
     *
     * @param html
     */
    static pasteHtml(html) {
        return EmojiEditor.pasteHtmlAtCaret(html + "&#8203;");
    }

    /**
     * saves the position of the cursor in a contenteditable div
     *
     * Credit goes to Tim Down here
     *
     * @returns {TextRange|Range|null}
     */
    static saveSelection() {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                return sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            return document.selection.createRange();
        }
        return null;
    }

    /**
     * Restores the selection using a Range object
     *
     * Credit goes to Tim Down here
     *
     * @param {Range} range
     */
    static restoreSelection(range) {
        if (range) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
    }

    /**
     * Pastes text at the caret position
     *
     * Credit goes to Tim Down here
     *
     * @param text
     * @returns {Text}
     */
    static pasteTextAtCaret(text) {
        let sel, range;
        const node = document.createTextNode(text);
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(node);
            }
        } else if (document.selection && document.selection.createRange) {
            document.selection.createRange().text = node.textContent;
        }

        return node;
    }


    /**
     * Selects an element an optionally highlights it. If it doesn't highlight,
     * it just drops the cursor at the end of the element.
     *
     *
     * Credit goes to Tim Down here
     *
     * @param element
     * @param highlight
     */
    static selectElement(element, highlight = false) {
        if (window.getSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(element);
            if (!highlight) {
                range.collapse(false);
            }
            sel.addRange(range);
        } else if (document.selection) {
            const text_range = document.body.createTextRange();
            text_range.moveToElementText(element);
            text_range.select();
        }
    }

    /**
     * Pastes html at the caret. Note that to do this without placing the
     * cursor inside of the html you need to add a dummy unicode character.
     * For our purposes we'll add the 0-width space and then strip it out when we parse the output
     *
     * Credit goes to Tim Down here
     *
     * @param html
     * @param select_pasted_content
     * @returns {*}
     */
    static pasteHtmlAtCaret(html, select_pasted_content) {
        let sel, range;
        if (window.getSelection) {
            //IE9+ and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                const el = document.createElement("div");
                el.innerHTML = html;
                let frag = document.createDocumentFragment(), node, last_node;
                while ((node = el.firstChild)) {
                    last_node = frag.appendChild(node);
                }

                const first_node = frag.firstChild;
                range.insertNode(frag);

                //Preserve the selection
                if (last_node) {
                    range = range.cloneRange();
                    range.setStartAfter(last_node);
                    if (select_pasted_content) {
                        range.setStartBefore(first_node);
                    } else {
                        range.collapse(false);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

                return first_node;
            }
        } else if ((sel = document.selection) && sel.type != "Control") {
            // IE < 9
            const original_range = sel.createRange();
            original_range.collapse(true);
            sel.createRange().pasteHTML(html);
            if (select_pasted_content) {
                range = sel.createRange();
                range.setEndPoint("StartToStart", original_range);
                range.select();
            }
        }
    }

    /**
     * Selects the contents of an element.
     *
     *
     * Credit goes to Tim Down here
     *
     * @param el
     */
    static selectElementContents(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}
