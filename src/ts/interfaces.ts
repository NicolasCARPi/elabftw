/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */

interface ResponseMsg {
  res: boolean;
  msg: string;
  color?: string;
  value?: string | Array<Todoitem> | Array<BoundEvent> | Array<UnfinishedExperiments> | Array<Upload> | object;
}

interface Upload {
  real_name: string;
  long_name: string;
}

interface Todoitem {
  id: number;
  body: string;
  creation_time: string;
}

interface UnfinishedExperiments {
  id: number;
  title: string;
  steps: Array<string>;
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
  Config = 'config',
  Link = 'link',
  Status = 'status',
  Step = 'step',
  Tag = 'tag',
  TeamGroup = 'teamgroup',
  Todolist = 'todolist',
  Upload = 'upload',
  User = 'user',
}

enum EntityType {
  Experiment = 'experiment',
  Item = 'item',
  ItemType = 'itemtype',
  Template = 'template',
}

enum Target {
  All = 'all',
  Body = 'body',
  BoundEvent = 'boundevent',
  Comment = 'comment',
  Date = 'date',
  Finished = 'finished',
  List = 'list',
  Member = 'member',
  Metadata = 'metadata',
  PrivacyPolicy = 'privacypolicy',
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
  BoundEvent,
  CheckableItem,
  ResponseMsg,
  Payload,
  Method,
  Action,
  Model,
  Target,
  Todoitem,
  EntityType,
  Entity,
  UnfinishedExperiments,
  Upload,
};
