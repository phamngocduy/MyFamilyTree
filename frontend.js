const {createApp} = await import('./packages/vue/dist/vue.esm-browser.prod.js');

const Member = {
    name: 'Member',
    props: {
        self: Object,
        editor: Boolean
    },
    template: document.getElementById('member').innerHTML
};

export default createApp({
    components: {
        Member
    },
    data() {
        return {
            family: {},
            editor: true
        };
    }
});