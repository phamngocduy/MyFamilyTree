function blockUI(block) {
    document.getElementById('blocker').style.display = block ? FLEX : NONE;
}
function loadUI(block) {
    document.getElementById('loader').style.display = block ? BLOCK : NONE;
}

window.addEventListener('init', function() {
    const {createApp} = Vue;
    window.xApp = createApp({
        data() {
            return {
                family: {}
            };
        },
        methods: {
            initChild(member) {
                this.member = member;
                eApp.category = 'CHILD';
                eApp.member = {};
                window.modal.show();
            },
            initSpouse(member) {
                this.member = member;
                eApp.category = 'SPOUSE';
                eApp.member = {};
                window.modal.show();
            },
            editMember(member) {
                this.member = member;
                eApp.category = 'MEMBER';
                revoke(loadMember(member.id), (member) => {
                    eApp.member = member;
                    window.modal.show();
                });
            }
        }
    }).mount('main');

    window.eApp = createApp({
        data() {
            return {
                member: {
                    history: [
                        {date: '2024', details: 'My Family Tree'}
                    ]
                },
                event_date: undefined,
                event_details: undefined,
                DATE_PATTERN: DATE_PATTERN
            };
        },
        computed: {
            sortHistory() {
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
    }).mount('#modal');
    
    window.modal = bootstrap.Modal.getOrCreateInstance('#modal');
    //document.getElementById('showModal').click()
});