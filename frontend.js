const {createApp} = await import('./packages/vue/dist/vue.esm-browser.js');

function VueJS(id) {
    return {
        created() {
            this.if = window.if;
            this.window = window;
        },
        template: document.querySelector(`vue#${id}`).innerHTML
    }
}

const Member = {
    ...VueJS('member'),
    props: {
        self: Object,
        primary: Boolean,
        editable: Boolean
    },
    computed: {
        isPrimary() {
            return this.primary || this.self.id == window.query;
        }
    },
    methods: {
        onClick() {
            const member = this.self;
            window.app.member = {...member.details};
            window.modal.show();
            window.modal.onSubmit = function() {
                invoke(window.api.saveMember(member.id, window.app.member),
                    () => member.details = window.app.member);
            };
        }
    }
};

const Family = {
    ...VueJS('family'),
    components: {
        Member
    },
    props: {
        self: Object,
        editable: Boolean
    },
    computed: {
        isPrimary() {
            return this.self.id == window.query;
        }
    },
    methods: {
        addChild(family) {
            window.app.member = {};
            window.modal.show();
            const parent_id = this.self.id;
            window.modal.onSubmit = function() {
                invoke(window.api.saveChild(family.id, parent_id, window.app.member),
                    ([family_id, child_id]) => {
                        family.id = family_id;
                        family.children.push({
                            id: child_id,
                            details: window.app.member
                        })
                    });
            }
        },
        addSpouse(family) {
            window.app.member = {};
            window.modal.show();
            const holder_id = this.self.id;
            window.modal.onSubmit = function() {
                invoke(window.api.saveSpouse(family.id, holder_id, window.app.member),
                    ([family_id, spouse_id]) => {
                        family.id = family_id;
                        family.spouse = {
                            id: spouse_id,
                            details: window.app.member
                        }
                    });
            }
        },
        dropChild(family, child) {
            if (confirm('Do you want to delete this member?')) {
                invoke(api.dropChild(family.id, child.id), (success) => {
                    if (success == true) {
                        family.children.remove(child);
                        if (family.spouse == undefined && family.children.length == 0)
                            family.id = undefined;
                    }
                });
            }
        },
        dropSpouse(family) {
            if (confirm('Do you want to delete this member?')) {
                invoke(api.dropSpouse(family.id, family.spouse.id), (success) => {
                    if (success == true) {
                        family.spouse = undefined;
                        if (family.children.length == 0)
                            family.id = undefined;
                    }
                });
            }
        }
    }
};

export default createApp({
    components: {
        Family, Member
    },
    data() {
        return {
            family: {},
            member: {},
            editable: true,
            event_date: undefined,
            event_details: undefined,
            DATE_PATTERN: DATE_PATTERN
        };
    },
    computed: {
        timeline() {
            if (this.member.history == undefined)
                this.member.history = [];
            return this.member.history.sort(
                (a, b) => parseDate(a.date) - parseDate(b.date)
            );
        }
    },
    methods: {
        addEvent() {
            const history = document.forms['history'];
            if (history.reportValidity()) {
                this.member.history.push({
                    date: this.event_date,
                    details: this.event_details
                });
                this.clsEvent();
                this.event_count++;
            }
        },
        delEvent(event) {
            this.member.history.splice(this.member.history.indexOf(event), 1);
        },
        clsEvent() {
            this.event_date = this.event_details = undefined;
        },
        toCanChi: (ddmmyyyy) => window.toCanChi(ddmmyyyy)
    }
});