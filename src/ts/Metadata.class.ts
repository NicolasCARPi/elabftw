/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
import Crud from './Crud.class';
import i18next from 'i18next';

export function ResourceNotFoundException(message: string) {
  this.message = message;
  this.name = 'ResourceNotFoundException';
}

export class Metadata extends Crud {
  type: string;
  id: string;
  what: string;

  constructor(type: string, id: string) {
    super('app/controllers/Ajax.php');
    this.type = type;
    this.id = id;
    this.what = 'metadata';
  }

  /**
   * Get the json from the metadata column
   */
  read() {
    return fetch(`${this.controller}?what=${this.what}&action=read&type=${this.type}&params[itemId]=${this.id}`).then(response => {
      if (!response.ok) {
        throw new Error('Error fetching metadata!');
      }
      return response.json();
    }).then(data => {
      // if there are no metadata.json file available, do nothing more
      if (data.res === false) {
        throw new ResourceNotFoundException('No metadata associated!');
      }
      return JSON.parse(data.msg);
    });
  }

  /**
   * Only save a single field value after a change
   */
  handleEvent(event) {
    let value = event.target.value;
    // special case for checkboxes
    if (event.target.type === 'checkbox') {
      value = event.target.checked ? 'on': 'off';
    }
    this.send({
      action: 'updateExtraField',
      what: this.what,
      type: this.type,
      params: {
        itemId: this.id,
        field: event.target.dataset.field,
        value: value,
      },
    });
  }

  /**
   * Save the whole json at once, coming from json editor save button
   */
  update(metadata) {
    this.send({
      action: 'update',
      what: this.what,
      type: this.type,
      params: {
        itemId: this.id,
        template: metadata,
      },
    });
  }


  /**
   * For radio we need a special build workflow
   */
  buildRadio(name: string, description: Record<string, any>): Element {
    // a div to hold the different elements so we can return a single Element
    const element = document.createElement('div');
    element.dataset.purpose = 'radio-holder';

    const radioInputs = [];
    const radiosName = this.getRandomId();
    for (const option of description.options) {
      const radioInput = document.createElement('input');
      radioInput.classList.add('form-check-input');
      radioInput.type = 'radio';
      radioInput.checked = description.value === option ? true : false;
      radioInput.value = option;
      // they all need to have the same name to work together
      radioInput.name = radiosName;
      radioInput.id = this.getRandomId();
      // add a data-field attribute so we know what to update on change
      radioInput.dataset.field = name;
      radioInputs.push(radioInput);
    }

    for (const input of radioInputs) {
      const wrapperDiv = document.createElement('div');
      wrapperDiv.classList.add('form-check', 'form-check-inline');
      element.appendChild(wrapperDiv);
      wrapperDiv.appendChild(input);
      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.innerText = input.value;
      label.classList.add('form-check-label');
      wrapperDiv.appendChild(label);
    }
    element.addEventListener('change', this, false);
    return element;
  }

  getRandomId(): string {
    return Math.random().toString(36).substr(2, 12);
  }

  /**
   * Take the json description of the field and build an input element to be injected
   */
  generateField(name: string, description: Record<string, any>): Element {
    // we don't know yet which kind of element it will be
    let element;
    // generate a unique id for the element so we can associate the label properly
    const uniqid = this.getRandomId();

    // read the type of element
    switch (description.type) {
      case 'number':
        element = document.createElement('input');
        element.type = 'number';
        break;
      case 'select':
        element = document.createElement('select');
        // add options to select element
        for (const option of description.options) {
          const optionEl = document.createElement('option');
          optionEl.text = option;
          element.add(optionEl);
        }
        break;
      case 'date':
        element = document.createElement('input');
        element.type = 'date';
        break;
      case 'checkbox':
        element = document.createElement('input');
        element.type = 'checkbox';
        break;
      case 'radio':
        return this.buildRadio(name, description);
        break;
      default:
        element = document.createElement('input');
        element.type = 'text';
    }

    // add the unique id to the element
    element.id = uniqid;

    if (description.hasOwnProperty('value')) {
      if (element.type === 'checkbox') {
        element.checked = description.value === 'on' ? true : false;
      }
      element.value = description.value;
    }

    if (description.hasOwnProperty('required')) {
      element.required = true;
    }

    // by default all inputs get this bootstrap class
    let cssClass = 'form-control';
    // but checkboxes/radios need a different one
    if (description.type === 'checkbox') {
      cssClass = 'form-check-input';
    }
    element.classList.add(cssClass);


    // add a data-field attribute so we know what to update on change
    element.dataset.field = name;
    // add an onChange listener to the element
    // so the json can be updated without having to click save
    // set the callback to the whole class so handleEvent is called and 'this' refers to the class
    // not the event in the function called
    element.addEventListener('change', this, false);
    return element;
  }

  /**
   * Get the metadata json and add input elements to DOM
   */
  addElements() {
    // this is the div that will hold all the generated fields from metadata json
    const metadataDiv = document.getElementById('metadataDiv');

    this.read().then(json => {
      const superTitleDiv = document.createElement('div');
      superTitleDiv.classList.add('row');
      const superTitle = document.createElement('h4');
      superTitle.innerText = i18next.t('extra-fields');
      metadataDiv.append(superTitleDiv);
      superTitleDiv.append(superTitle);
      // the input elements that will be created from the extra fields
      const elements = [];
      for (const [name, description] of Object.entries(json.extra_fields)) {
        elements.push({ name: name, element: this.generateField(name, description)});
      }
      // now display the inputs from extra_fields
      for (const element of elements) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
        metadataDiv.append(rowDiv);
        const label = document.createElement('label');
        label.htmlFor = element.element.id;
        label.innerText = element.name as string;
        if (element.element.type === 'checkbox') {
          label.classList.add('form-check-label');
        }
        // for checkboxes the label comes second
        if (element.element.type === 'checkbox') {
          const wrapperDiv = document.createElement('div');
          wrapperDiv.classList.add('form-check');
          rowDiv.append(wrapperDiv);
          wrapperDiv.append(element.element);
          // add some spacing between the checkbox and the label
          label.classList.add('ml-1');
          wrapperDiv.append(label);
        } else {
          rowDiv.append(label);
          rowDiv.append(element.element);
        }
      }
    }).catch(e => {
      if (e instanceof ResourceNotFoundException) {
        // no metadata is associated but it's okay, it's not an error
        return;
      }
      // if there was an issue fetching metadata, log the error
      console.error(e);
      return;
    });
  }
}