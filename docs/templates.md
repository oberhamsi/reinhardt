The Reinhardt template language
============================

This document explains the language syntax of the Reinhardt template system.

The Reinhardt template language is designed to strike a balance between power and
ease. It's designed to feel comfortable to those used to working with HTML. If
you have any exposure to other text-based template languages, such as Smarty
or CheetahTemplate, you should feel right at home with Reinhardt's templates.

**Table of Contents**

- [Templates](#templates)
- [Variables](#variables)
- [Filters](#filters)
  - [default](#default)
  - [length](#length)
  - [striptags](#striptags)
- [Tags](#tags)
  - [for](#for)
  - [if and else](#if-and-else)
  - [block and extends](#block-and-extends)
- [Comments](#comments)
- [Template inheritance](#template-inheritance)
- [Automatic HTML escaping](#automatic-html-escaping)
  - [How to turn it off](#how-to-turn-it-off)
  - [For individual variables](#for-individual-variables)
  - [For template blocks](#for-template-blocks)
  - [Notes](#notes)
  - [String literals and automatic escaping](#string-literals-and-automatic-escaping)
- [Accessing functions](#accessing-functions)
- [Custom tag and filter libraries](#custom-tag-and-filter-libraries)
  - [Custom libraries and template inheritance](#custom-libraries-and-template-inheritance)

Templates
=========

A template is simply a text file. It can generate any text-based format (HTML,
XML, CSV, etc.).

A template contains **variables**, which get replaced with values when the
template is evaluated, and **tags**, which control the logic of the template.

Below is a minimal template that illustrates a few basics. Each element will be
explained later in this document.

    {% extends "base_generic.html" %}

    {% block title %}{{ section.title }}{% endblock %}

    {% block content %}
    <h1>{{ section.title }}</h1>

    {% for story in story_list %}
    <h2>
      <a href="{{ story.get_absolute_url }}">
        {{ story.headline|upper }}
      </a>
    </h2>
    <p>{{ story.tease|truncatewords:"100" }}</p>
    {% endfor %}
    {% endblock %}


Variables
=========

Variables look like this: ``{{ variable }}``. When the template engine
encounters a variable, it evaluates that variable and replaces it with the
result. Variable names consist of any combination of alphanumeric characters
and the underscore (``"_"``). The dot (``"."``) also appears in variable
sections, although that has a special meaning, as indicated below.
Importantly, *you cannot have spaces or punctuation characters in variable
names.*

In the above example, `{{ section.title }}` will be replaced with the
`title` attribute of the ``section`` object.

If you use a variable that doesn't exist, the template system will insert
the value of the `stringIfUndefined`, which is set to `''` (the empty string)
by default.

Note that "bar" in a template expression like ``{{ foo.bar }}`` will be
interpreted as a literal string and not using the value of the variable "bar",
if one exists in the template context.

Filters
=======

You can modify variables for display by using **filters**.

Filters look like this: ``{{ name|lower }}``. This displays the value of the
``{{ name }}`` variable after being filtered through the `lower`
filter, which converts text to lowercase. Use a pipe (``|``) to apply a filter.

Filters can be "chained." The output of one filter is applied to the next.
``{{ text|escape|linebreaks }}`` is a common idiom for escaping text contents,
then converting line breaks to ``<p>`` tags.

Some filters take arguments. A filter argument looks like this: ``{{
bio|truncatewords:30 }}``. This will display the first 30 words of the ``bio``
variable.

Filter arguments that contain spaces must be quoted; for example, to join a
list with commas and spaced you'd use ``{{ list|join:", " }}``.

Reinhardt provides about thirty built-in template filters. You can read all about
them in the [built-in filter reference](filters.md). To give you a taste of what's
available, here are some of the more commonly used template filters:

`default`
----------

If a variable is false or empty, use given default. Otherwise, use the
value of the variable

    For example:

        {{ value|default:"nothing" }}

    If ``value`` isn't provided or is empty, the above will display
    "``nothing``".

`length`
----------

Returns the length of the value. This works for both strings and lists;
for example:

        {{ value|length }}

If ``value`` is ``['a', 'b', 'c', 'd']``, the output will be ``4``.

`striptags`
----------

Strips all [X]HTML tags. For example:

        {{ value|striptags }}

If ``value`` is ``"<b>Joel</b> <button>is</button> a
<span>slug</span>"``, the output will be ``"Joel is a slug"``.

Again, these are just a few examples; see the (filter reference)[filters.md] for the complete list.


Tags
====

Tags look like this: ``{% tag %}``. Tags are more complex than variables: Some
create text in the output, some control flow by performing loops or logic, and
some load external information into the template to be used by later variables.

Some tags require beginning and ending tags (i.e. ``{% tag %} ... tag contents
... {% endtag %}``).

Reinhardt ships with about two dozen built-in template tags. You can read all about
them in the [tag reference](tags.md). To give
you a taste of what's available, here are some of the more commonly used
tags:

`for`
----------

Loop over each item in an array.  For example, to display a list of athletes
provided in ``athlete_list``:

        <ul>
        {% for athlete in athlete_list %}
            <li>{{ athlete.name }}</li>
        {% endfor %}
        </ul>

`if` and ``else``
----------

Evaluates a variable, and if that variable is "true" the contents of the
block are displayed:

        {% if athlete_list %}
            Number of athletes: {{ athlete_list|length }}
        {% else %}
            No athletes.
        {% endif %}

In the above, if ``athlete_list`` is not empty, the number of athletes
will be displayed by the ``{{ athlete_list|length }}`` variable.

You can also use filters and various operators in the `if` tag:

        {% if athlete_list|length > 1 %}
           Team: {% for athlete in athlete_list %} ... {% endfor %}
        {% else %}
           Athlete: {{ athlete_list.0.name }}
        {% endif %}

While the above example works, be aware that most template filters return
strings, so mathematical comparisons using filters will generally not work
as you expect. `length` is an exception.

`block` and `extends`
----------

Set up template inheritance (see below), a powerful way
of cutting down on "boilerplate" in templates.

Again, the above is only a selection of the whole list; see the
[built-in tag reference](tags.md) for the complete list.


Comments
========

To comment-out part of a line in a template, use the comment syntax: ``{# #}``.

For example, this template would render as ``'hello'``:

    {# greeting #}hello

A comment can contain any template code, invalid or not. For example:

    {# {% if foo %}bar{% else %} #}

This syntax can only be used for single-line comments (no newlines are permitted
between the ``{#`` and ``#}`` delimiters). If you need to comment out a
multiline portion of the template, see the `comment` tag.


Template inheritance
====================

The most powerful -- and thus the most complex -- part of Reinhardt's template
engine is template inheritance. Template inheritance allows you to build a base
"skeleton" template that contains all the common elements of your site and
defines **blocks** that child templates can override.

It's easiest to understand template inheritance by starting with an example:

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <link rel="stylesheet" href="style.css" />
        <title>{% block title %}My amazing site{% endblock %}</title>
    </head>

    <body>
        <div id="sidebar">
            {% block sidebar %}
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/blog/">Blog</a></li>
            </ul>
            {% endblock %}
        </div>

        <div id="content">
            {% block content %}{% endblock %}
        </div>
    </body>
    </html>

This template, which we'll call ``base.html``, defines a simple HTML skeleton
document that you might use for a simple two-column page. It's the job of
"child" templates to fill the empty blocks with content.

In this example, the `block` tag defines three blocks that child
templates can fill in. All the `block` tag does is to tell the template
engine that a child template may override those portions of the template.

A child template might look like this:

    {% extends "base.html" %}

    {% block title %}My amazing blog{% endblock %}

    {% block content %}
    {% for entry in blog_entries %}
        <h2>{{ entry.title }}</h2>
        <p>{{ entry.body }}</p>
    {% endfor %}
    {% endblock %}

The `extends` tag is the key here. It tells the template engine that
this template "extends" another template. When the template system evaluates
this template, first it locates the parent -- in this case, "base.html".

At that point, the template engine will notice the three `block` tags
in ``base.html`` and replace those blocks with the contents of the child
template. Depending on the value of ``blog_entries``, the output might look
like:

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <link rel="stylesheet" href="style.css" />
        <title>My amazing blog</title>
    </head>

    <body>
        <div id="sidebar">
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/blog/">Blog</a></li>
            </ul>
        </div>

        <div id="content">
            <h2>Entry one</h2>
            <p>This is my first entry.</p>

            <h2>Entry two</h2>
            <p>This is my second entry.</p>
        </div>
    </body>
    </html>

Note that since the child template didn't define the ``sidebar`` block, the
value from the parent template is used instead. Content within a ``{% block %}``
tag in a parent template is always used as a fallback.

You can use as many levels of inheritance as needed. One common way of using
inheritance is the following three-level approach:

* Create a ``base.html`` template that holds the main look-and-feel of your
  site.
* Create a ``base_SECTIONNAME.html`` template for each "section" of your
  site. For example, ``base_news.html``, ``base_sports.html``. These
  templates all extend ``base.html`` and include section-specific
  styles/design.
* Create individual templates for each type of page, such as a news
  article or blog entry. These templates extend the appropriate section
  template.

This approach maximizes code reuse and makes it easy to add items to shared
content areas, such as section-wide navigation.

Here are some tips for working with inheritance:

* If you use `{% extends %}<extends>` in a template, it must be the first template
  tag in that template. Template inheritance won't work, otherwise.

* More `{% block %}<block>` tags in your base templates are better. Remember,
  child templates don't have to define all parent blocks, so you can fill
  in reasonable defaults in a number of blocks, then only define the ones
  you need later. It's better to have more hooks than fewer hooks.

* If you find yourself duplicating content in a number of templates, it
  probably means you should move that content to a ``{% block %}`` in a
  parent template.

* If you need to get the content of the block from the parent template,
  the ``{{ block.super }}`` variable will do the trick. This is useful
  if you want to add to the contents of a parent block instead of
  completely overriding it. Data inserted using ``{{ block.super }}`` will
  not be automatically escaped (see the `next section`_), since it was
  already escaped, if necessary, in the parent template.

* For extra readability, you can optionally give a *name* to your
  ``{% endblock %}`` tag. For example:

      {% block content %}
      ...
      {% endblock content %}

  In larger templates, this technique helps you see which ``{% block %}``
  tags are being closed.

Finally, note that you can't define multiple `block` tags with the same
name in the same template. This limitation exists because a block tag works in
"both" directions. That is, a block tag doesn't just provide a hole to fill --
it also defines the content that fills the hole in the *parent*. If there were
two similarly-named `block` tags in a template, that template's parent
wouldn't know which one of the blocks' content to use.


Automatic HTML escaping
=======================

When generating HTML from templates, there's always a risk that a variable will
include characters that affect the resulting HTML. For example, consider this
template fragment:

    Hello, {{ name }}.

At first, this seems like a harmless way to display a user's name, but consider
what would happen if the user entered his name as this:

    <script>alert('hello')</script>

With this name value, the template would be rendered as:

    Hello, <script>alert('hello')</script>

...which means the browser would pop-up a JavaScript alert box!

Similarly, what if the name contained a ``'<'`` symbol, like this?

.. code-block: html

    <b>username

That would result in a rendered template like this:

    Hello, <b>username

...which, in turn, would result in the remainder of the Web page being bolded!

Clearly, user-submitted data shouldn't be trusted blindly and inserted directly
into your Web pages, because a malicious user could use this kind of hole to
do potentially bad things. This type of security exploit is called a
[Cross Site Scripting](http://en.wikipedia.org/wiki/Cross-site_scripting) attack.

To avoid this problem, you have two options:

* One, you can make sure to run each untrusted variable through the
  `escape` filter (documented below), which converts potentially
  harmful HTML characters to unharmful ones. This was the default solution
  in Reinhardt for its first few years, but the problem is that it puts the
  onus on *you*, the developer / template author, to ensure you're escaping
  everything. It's easy to forget to escape data.

* Two, you can take advantage of Reinhardt's automatic HTML escaping. The
  remainder of this section describes how auto-escaping works.

By default in Reinhardt, every template automatically escapes the output
of every variable tag. Specifically, these five characters are
escaped:

* ``<`` is converted to ``&lt;``
* ``>`` is converted to ``&gt;``
* ``'`` (single quote) is converted to ``&#39;``
* ``"`` (double quote) is converted to ``&quot;``
* ``&`` is converted to ``&amp;``

Again, we stress that this behavior is on by default. If you're using Reinhardt's
template system, you're protected.

How to turn it off
------------------

If you don't want data to be auto-escaped, on a per-site, per-template level or
per-variable level, you can turn it off in several ways.

Why would you want to turn it off? Because sometimes, template variables
contain data that you *intend* to be rendered as raw HTML, in which case you
don't want their contents to be escaped. For example, you might store a blob of
HTML in your database and want to embed that directly into your template. Or,
you might be using Reinhardt's template system to produce text that is *not* HTML
-- like an email message, for instance.

For individual variables
--------------------------

To disable auto-escaping for an individual variable, use the `safe`
filter:

    This will be escaped: {{ data }}
    This will not be escaped: {{ data|safe }}

Think of *safe* as shorthand for *safe from further escaping* or *can be
safely interpreted as HTML*. In this example, if ``data`` contains ``'<b>'``,
the output will be:

    This will be escaped: &lt;b&gt;
    This will not be escaped: <b>

For template blocks
--------------------------

To control auto-escaping for a template, wrap the template (or just a
particular section of the template) in the `autoescape` tag, like so:

    {% autoescape off %}
        Hello {{ name }}
    {% endautoescape %}

The `autoescape` tag takes either ``on`` or ``off`` as its argument. At
times, you might want to force auto-escaping when it would otherwise be
disabled. Here is an example template:

    Auto-escaping is on by default. Hello {{ name }}

    {% autoescape off %}
        This will not be auto-escaped: {{ data }}.

        Nor this: {{ other_data }}
        {% autoescape on %}
            Auto-escaping applies again: {{ name }}
        {% endautoescape %}
    {% endautoescape %}

The auto-escaping tag passes its effect onto templates that extend the
current one as well as templates included via the `include` tag,
just like all block tags. For example:

    # base.html

    {% autoescape off %}
    <h1>{% block title %}{% endblock %}</h1>
    {% block content %}
    {% endblock %}
    {% endautoescape %}


    # child.html

    {% extends "base.html" %}
    {% block title %}This & that{% endblock %}
    {% block content %}{{ greeting }}{% endblock %}

Because auto-escaping is turned off in the base template, it will also be
turned off in the child template, resulting in the following rendered
HTML when the ``greeting`` variable contains the string ``<b>Hello!</b>``:

    <h1>This & that</h1>
    <b>Hello!</b>

Notes
-----

Generally, template authors don't need to worry about auto-escaping very much.
Developers on the JavaScript side (people writing views and custom filters) need to
think about the cases in which data shouldn't be escaped, and mark data
appropriately, so things Just Work in the template.

If you're creating a template that might be used in situations where you're
not sure whether auto-escaping is enabled, then add an `escape` filter
to any variable that needs escaping. When auto-escaping is on, there's no
danger of the `escape` filter *double-escaping* data -- the
`escape` filter does not affect auto-escaped variables.

String literals and automatic escaping
--------------------------------------

As we mentioned earlier, filter arguments can be strings:

    {{ data|default:"This is a string literal." }}

All string literals are inserted **without** any automatic escaping into the
template -- they act as if they were all passed through the `safe`
filter. The reasoning behind this is that the template author is in control of
what goes into the string literal, so they can make sure the text is correctly
escaped when the template is written.

This means you would write :

    {{ data|default:"3 &lt; 2" }}

...rather than :

    {{ data|default:"3 < 2" }}  <-- Bad! Don't do this.

This doesn't affect what happens to data coming from the variable itself.
The variable's contents are still automatically escaped, if necessary, because
they're beyond the control of the template author.

Accessing functions
======================

Most method functions attached to objects are also available from within templates.
This means that templates have access to much more than just class attributes
(like field names) and variables passed in from views.

Because Reinhardt intentionally limits the amount of logic processing available
in the template language, it is not possible to pass arguments to function calls
accessed from within templates. Data should be calculated in views, then passed
to templates for display.

Custom tag and filter libraries
===============================

Certain applications provide custom tag and filter libraries. To access them in
a template, use the `loadtag` and `loadfilter` tag respectively:

    {% loadtag comments %}

    {% comment_form for blogs.entries entry.id with is_public yes %}

In the above, the `loadtag` tag loads the ``comments`` tag library, which then
makes the ``comment_form`` tag available for use. Consult the documentation
area in your admin to find the list of custom libraries in your installation.

The `loadtag` tag can take multiple library names, separated by spaces.
Example:

    {% loadtag comments i18n %}

See the [HowTo on custom template tags](custom-template-tags.md) for information on writing your own custom
template libraries.

Custom libraries and template inheritance
-----------------------------------------

When you load a custom tag or filter library, the tags/filters are only made
available to the current template -- not any parent or child templates along
the template-inheritance path.

For example, if a template ``foo.html`` has ``{% load comments %}``, a child
template (e.g., one that has ``{% extends "foo.html" %}``) will *not* have
access to the comments template tags and filters. The child template is
responsible for its own ``{% load comments %}``.

This is a feature for the sake of maintainability and sanity.
