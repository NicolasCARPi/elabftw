/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */

interface ActionReq {
  action: string;
  csrf?: string;
  what: string;
  type?: string;
  params?: object;
}

interface ResponseMsg {
  res: boolean;
  msg: string | Array<BoundEvent>;
  color?: string;
  value?: string;
}

interface BoundEvent {
  item: string;
  start: string;
}

interface CheckableItem {
  id: number;
  randomid: number;
}

enum Method {
  POST = 'POST',
  GET = 'GET',
}

enum Action {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Destroy = 'destroy',

  Deduplicate = 'deduplicate',
  Duplicate = 'duplicate',
  Lock = 'lock',
  Unreference = 'unreference',
}

enum Model {
  Apikey = 'apikey',
  Comment = 'comment',
  Link = 'link',
  Status = 'status',
  Step = 'step',
  Tag = 'tag',
  Todolist = 'todolist',
  Upload = 'upload',
}

enum EntityType {
  Experiment = 'experiment',
  Item = 'item',
  ItemType = 'itemtype',
  Template = 'template',
}

enum Target {
  Body = 'body',
  Date = 'date',
  Comment = 'comment',
  Finished = 'finished',
  Metadata = 'metadata',
  RealName = 'real_name',
  Tag = 'tag',
  Title = 'title',
}

interface Entity {
  type: EntityType;
  id: number;
}


interface Payload {
  method: Method;
  action: Action;
  model: Model | EntityType;
  entity?: {
    type: Entity['type'];
    id: Entity['id'];
  };
  content?: string;
  target?: Target;
  id?: number;
  extraParams?: {};
}

export {
  ActionReq,
  BoundEvent,
  CheckableItem,
  ResponseMsg,
  Payload,
  Method,
  Action,
  Model,
  Target,
  EntityType,
  Entity,
};
