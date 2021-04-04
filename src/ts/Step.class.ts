/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
import Crud from './Crud.class';
import { relativeMoment, makeSortableGreatAgain } from './misc';
import i18next from 'i18next';
import { Payload, Method, Model, Target, Type, Entity, Action } from './interfaces';
import { Ajax } from './Ajax.class';

export default class Step extends Crud {
  type: string;
  sender: Ajax;

  constructor(type: string) {
    super('app/controllers/Ajax.php');
    this.type = type;
    this.sender = new Ajax();
  }

  create(content: string, entity: Entity) {
    const payload: Payload = {
      method: Method.POST,
      action: Action.Create,
      model: Model.Step,
      entity: entity,
      content: content,
    };
    return this.sender.send(payload);
  }

  update(content: string, entity: Entity, id: number) {
    const payload: Payload = {
      method: Method.POST,
      action: Action.Update,
      model: Model.Step,
      target: Target.Body,
      entity: entity,
      content: content,
      id : id,
    };
    return this.sender.send(payload);
  }

  finish(elem): void {
    // the id of the exp/item/tpl
    const id = elem.dataset.id;
    const stepId = elem.dataset.stepid;
    // on the todolist we don't want to grab the type from the page
    // because it's only steps from experiments
    // so if the element has a data-type, take that instead
    let itemType = this.type;
    if (elem.dataset.type) {
      itemType = elem.dataset.type;
    }

    this.send({
      action: 'finish',
      what: 'step',
      type: itemType,
      params: {
        itemId: id,
        id: stepId,
      },
    }).then(() => {
      // only reload children
      const loadUrl = window.location.href + ' #steps_div_' + id + ' > *';
      // reload the step list
      $('#steps_div_' + id).load(loadUrl, function() {
        relativeMoment();
        makeSortableGreatAgain();
      });
      $('#todo_step_' + stepId).prop('checked', true);
    });
  }

  destroy(elem): void {
    // the id of the exp/item/tpl
    const id = elem.dataset.id;
    const stepId = elem.dataset.stepid;
    if (confirm(i18next.t('step-delete-warning'))) {
      this.send({
        action: 'destroy',
        what: 'step',
        type: this.type,
        params: {
          itemId: id,
          id: stepId,
        },
      }).then(() => {
        // only reload children
        const loadUrl = window.location + ' #steps_div_' + id + ' > *';
        // reload the step list
        $('#steps_div_' + id).load(loadUrl, function() {
          relativeMoment();
          makeSortableGreatAgain();
        });
      });
    }
  }
}
