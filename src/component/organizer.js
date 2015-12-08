/* Intention is to interact with localStorage and display a list of items here.
 *
 * I will think of a buttiful quote and/or friendly face soon enough.
 */

/* ~~ brainstorming shit here ~~
 *
 * The first step in this journey is to create a couple helper functions
 * to help interact with localStorage. It is a fairly simple API and I do not
 * need to do anything fancy, so a complete abstraction is not necessary.
 *  ->  save: saves a list by invoking JSON.stringify(). toJSON needs to be
 *            overriden in List in order for a *clean* serialized save op.
 *            Needs to be fast, as this may be called very frequently.
 *  ->  load: returns a loaded List object from an ID reference
 *  ->  lists: lists references to saved lists. It is my intention to
 *             organize by date modified.
 *
 * The next step is to render the data. The list of lists should be show in
 * a sidebar on the left.
 *
 *
 */