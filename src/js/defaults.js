export default {
    //Sets of categories and icons. The category names are not arbitrary, they map
    //to the names of categories in data.js
    categories: [
        {
            title: "Smileys & Emotion",
            icon: '<i class="fas fa-smile" aria-hidden="true"></i>'
        },
        {
            title: "People & Body",
            icon: '<i class="fas fa-user" aria-hidden="true"></i>'
        },
        {
            title: "Animals & Nature",
            icon: '<i class="fas fa-leaf" aria-hidden="true"></i>'
        },
        {
            title: "Food & Drink",
            icon: '<i class="fas fa-utensils" aria-hidden="true"></i>'
        },
        {
            title: "Activities",
            icon: '<i class="fas fa-futbol" aria-hidden="true"></i>'
        },
        {
            title: "Travel & Places",
            icon: '<i class="fas fa-globe" aria-hidden="true"></i>'
        },
        {
            title: "Symbols",
            icon: '<i class="fas fa-lightbulb" aria-hidden="true"></i>'
        },
        {
            title: "Objects",
            icon: '<i class="fas fa-pied-piper-hat" aria-hidden="true"></i>'
        },
        {
            title: "Flags",
            icon: '<i class="fas fa-flag-checkered" aria-hidden="true"></i>'
        }
    ],

    //By default we show an magnifying glass icon in the search container,
    //but if you're not using fontawesome you may want to include your own icon.
    search_icon: '<i class="fas fa-search" aria-hidden="true"></i>',

    //Show the colon syntax in the preview or don't. It may not make sense if you're
    //using a contenteditable element to confuse users with unfamiliar colon syntax
    show_colon_preview: true,

    //If you want your contenteditable to be a single-line input, set this to true
    prevent_new_line: false,

    //The text that will be displayed when no emoji is being hovered over.
    default_footer_message: "Please select an emoji from the list above",

    //Can be "autoplace", "vertical", "horizontal", or a function that takes a tooltip as an argument.
    //The tooltip is an instance of the class in this repo here: https://github.com/RobertMenke/Tooltip-js
    positioning: "autoplace",

    //Callback that occurs when an emoji gets selected. You get back Emoji, EmojiCategory, Node
    callback: undefined,

    //Called whenever the picker is open
    onOpen: undefined,

    //Called when the picker has finished parsing and creating markup for each emoji. The callback will be passed
    //an array of EmojiCategory objects
    onReady: undefined,

    //When the user hovers over the top row of icons, do you want them to be shown
    //a tooltip indicating which category the icon represents?
    show_icon_tooltips: true,

    //Use sprite sheets to display image emojis rather than links to png files (faster).
    //If you want links to the png files see this repo here for examples (library I'm using):
    //https://github.com/iamcal/emoji-data
    use_sheets: true,

    //Events that bubble up from Emoji to EmojiPicker - DO NOT MUTATE
    //Normally I'd use pubsub here, but didn't feel like writing my own implementation
    //or bringing in another dependency for this simple use case.
    events: {
        SELECTED: "SELECTED",
        EMOJI_MOUSEENTER: "MOUSEENTER",
        EMOJI_MOUSELEAVE: "MOUSELEAVE"
    },

    //Paths to the sprite sheets (see the sheets folder in this repo. You'll likely
    //need to override this setting.
    sheets: {
        apple: './sheets/sheet_apple_64_indexed_128.png',
        google: './sheets/sheet_google_64_indexed_128.png',
        twitter: './sheets/sheet_twitter_64_indexed_128.png',
        facebook: './sheets/sheet_facebook_64_indexed_128.png'
    },

    //Set the default sheet
    //Default value is 'apple'
    //Possible values are 'apple','google','twitter','facebook'
    palette: 'apple',

    //Set the default saving method in getHtml method
    //default value is 'utf8'
    //possible values are 'html','img','utf8'
    save_html_as: 'utf8'
}