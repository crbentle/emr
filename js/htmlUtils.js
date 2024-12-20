function createElement(type, { attributes, childNodes, text } = {}) {
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

    if(!!text) {
        element.appendChild(document.createTextNode(text));
    }

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

function findParentByType(childNode, parentType) {
    const parent = childNode?.parentNode;
    const parentTag = parent?.tagName;
    if(!parentTag){
        return null;
    }
    if(parentTag.toUpperCase() === parentType.toUpperCase()){
        return parent;
    }
    return findParentType(parent, parentType);

}
