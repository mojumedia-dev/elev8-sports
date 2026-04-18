# Elev8 Sports QA Checklist

Follow the Build → QA → Fix → Deploy process for all releases.

---

## 1. BUILD
- [ ] Code written mobile-first (320px base, scale up)
- [ ] Commits are frequent with clear messages
- [ ] Basic self-test: app runs, no console errors, core flow works

---

## 2. QA

### Functional
- [ ] Sign up / sign in works (parent, coach, org admin roles)
- [ ] Team creation and roster management
- [ ] GameChanger CSV import completes without errors
- [ ] Player profiles display imported stats correctly
- [ ] Schedule creation, RSVP tracking works
- [ ] Team messaging sends/receives
- [ ] Multi-child family hub — switching between children works
- [ ] Organization multi-team admin functions correctly

### Responsive (test at 320px, 375px, 768px, 1024px, 1440px)
- [ ] Nav/header adapts on mobile
- [ ] Roster and schedule tables scroll or stack correctly
- [ ] Player profiles readable on small screens
- [ ] Forms (RSVP, messaging) usable on mobile

### Cross-browser
- [ ] Chrome
- [ ] Safari (mobile + desktop)
- [ ] Firefox

### Security
- [ ] All routes enforce role-based auth (parent vs coach vs org admin)
- [ ] CSV upload validates file type and size
- [ ] No sensitive player/family data exposed in public routes
- [ ] Input fields sanitized (no XSS)
- [ ] API keys/secrets not exposed client-side

### Performance
- [ ] Stat import handles large CSV files without timeout
- [ ] Team pages load within 3s on mobile connection

---

## 3. FIX

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| | | | |

Severity: **Critical** (blocks usage) / **High** (major UX break) / **Medium** (noticeable, workaround exists) / **Low** (minor polish)

All Critical and High issues must be resolved before deploy.

---

## 4. DEPLOY
- [ ] All Critical/High issues resolved
- [ ] Final responsive check on staging/prod URL
- [ ] Env vars verified
- [ ] Build passes
- [ ] Smoke test: sign in → create team → import stats → view profile

---

## Key Rules
- Never skip security review (family/minor data requires extra care)
- Never skip responsive testing (parents use phones, not desktops)
- Document all issues found — even if deferred
- Fix Critical/High before shipping
