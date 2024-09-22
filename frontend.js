const {createApp} = await import('./packages/vue/dist/vue.esm-browser.js');

function VueJS(id) {
    return {
        name: id,
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
        member: Object,
        family: Object,
        editable: Boolean,
        droppable: Boolean
    },
    computed: {
        primary() {
            const query = window.query;
            const member = this.member;
            const family = this.family;
            const holder = family.holder;
            const spouse = family.spouse;
            return member.id == query || (member == spouse && holder?.id == query);
        }
    },
    methods: {
        onUpdate() {
            const member = this.member;
            window.app.member = {...member.details};
            window.modal.onSubmit = function() {
                invoke(window.api.saveMember(member.id, window.app.member),
                    () => member.details = window.app.member);
            };
            window.modal.show();
        },
        onDelete() {
            if (confirm('Do you want to delete this member?')) {
                const member = this.member;
                const family = this.family;
                if (family.spouse === member)
                    this.dropSpouse(family, member);
                else this.dropChild(family, member);
            }
        },
        dropChild(family, child) {
            invoke(api.dropChild(family.id, child.id), (success) => {
                if (success == true) {
                    family.children.remove(child);
                    if (family.spouse == undefined && family.children.length == 0)
                        family.id = undefined;
                }
            });
        },
        dropSpouse(family, spouse) {
            invoke(api.dropSpouse(family.id, spouse.id), (success) => {
                if (success == true) {
                    family.spouse = undefined;
                    if (family.children.length == 0)
                        family.id = undefined;
                }
            });
        }
    }
};

const Family = {
    ...VueJS('family'),
    components: {
        Member
    },
    props: {
        holder: Object,
        parents: Object,
        editable: Boolean
    },
    computed: {
        primary() {
            return this.holder.id == window.query;
        },
        families() {
            const holder = this.holder;
            if (holder.families.length == 0)
                holder.families.push({children: []});
            for (const family of holder.families)
                family.holder = holder;
            return holder.families;
        }
    },
    methods: {
        addChild(family) {
            window.app.member = {};
            const parent_id = this.holder.id;
            window.modal.onSubmit = function() {
                invoke(window.api.saveChild(family.id, parent_id, window.app.member),
                    ([family_id, child_id]) => {
                        family.id = family_id;
                        family.children.push({
                            id: child_id,
                            families: [],
                            details: window.app.member
                        })
                    });
            };
            window.modal.show();
        },
        addSpouse(family) {
            window.app.member = {};
            const holder_id = this.holder.id;
            window.modal.onSubmit = function() {
                invoke(window.api.saveSpouse(family.id, holder_id, window.app.member),
                    ([family_id, spouse_id]) => {
                        family.id = family_id;
                        family.spouse = {
                            id: spouse_id,
                            details: window.app.member
                        }
                    });
            };
            window.modal.show();
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