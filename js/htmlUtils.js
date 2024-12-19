

function createElement(type, { attributes, childNodes } = {}) {
    const element = document.createElement(type);
    if (attributes) {
        for (let [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
    }

    childNodes?.forEach((node) => {
        if (node) {
            element.appendChild(node);
        }
    });

    return element;
}

/**
 * Convert an HTML string into a list NodeList.
 *
 * @param {String} HTML representing any number of sibling nodes
 * @return {NodeList} 
 */
function htmlToNodes(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}