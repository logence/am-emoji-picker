import $ from "jquery";
import EmojiPicker from "./../../dist/EmojiPicker";

$(document).ready(() => {

    const icon = document.querySelector('.fa-smile');
    const container = document.getElementById('container');
    const input = document.getElementById('text-input');

    const picker = new EmojiPicker({
        sheets: {
            apple   : './../sheets/sheet_apple_64_indexed_128.png',
            google  : './../sheets/sheet_google_64_indexed_128.png',
            twitter : './../sheets/sheet_twitter_64_indexed_128.png',
            emojione: './../sheets/sheet_emojione_64_indexed_128.png'
        },
        palette: 'twitter',
        positioning: "vertical",
        save_html_as: 'img',
        use_sheets: true,
    });
    picker.listenOn(icon, container, input);

    setInterval(() => {
        console.log('text', picker.getText());
        console.log('html', picker.getHtml());
    }, 4000);
});
