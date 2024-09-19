const {createApp} = await import('./packages/vue/dist/vue.esm-browser.prod.js');

const Creator = {
    props: {primary: Boolean},
    template: document.getElementById('creator').innerHTML
}

const Updator = {
    props: {primary: Boolean},
    template: document.getElementById('updator').innerHTML
}

const Member = {
    name: 'Member',
    components: {
        Creator, Updator
    },
    props: {
        self: Object,
        editor: Boolean
    },
    created() {this.window = window},
    template: document.getElementById('member').innerHTML
};

export default createApp({
    components: {Member},
    data() {
        return {
            family: {},
            editor: true
        };
    }
});