import {CustomElementType} from "../CustomElement";

const withLinks = (editor) => {
    const { isInline } = editor;
  
    editor.isInline = (element) =>
      element.type === CustomElementType.anchor ? true : isInline(element);
  
    return editor;
  };
  
  export default withLinks;