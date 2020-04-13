<?php
/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare(strict_types=1);

namespace Elabftw\Models;

use Elabftw\Exceptions\ImproperActionException;
use Elabftw\Services\Filter;
use Elabftw\Traits\SortableTrait;
use PDO;

/**
 * All about the templates
 */
class Templates extends AbstractEntity
{
    use SortableTrait;

    /**
     * Constructor
     *
     * @param Users $users
     * @param int|null $id
     */
    public function __construct(Users $users, ?int $id = null)
    {
        parent::__construct($users, $id);
        $this->type = 'experiments_templates';
    }

    /**
     * The create function from abstract class in not implemented here
     *
     * @param int $id
     * @return int
     */
    public function create(int $id): int
    {
        return $id;
    }

    /**
     * Create a template
     *
     * @param string $name
     * @param string $body
     * @param int|null $userid
     * @param int|null $team
     * @return void
     */
    public function createNew(string $name, string $body, ?int $userid = null, ?int $team = null): void
    {
        if ($team === null) {
            $team = $this->Users->userData['team'];
        }
        if ($userid === null) {
            $userid = $this->Users->userData['userid'];
        }

        $canread = 'team';
        $canwrite = 'user';

        if ($this->Users->userData['default_read'] !== null) {
            $canread = $this->Users->userData['default_read'];
        }
        if ($this->Users->userData['default_write'] !== null) {
            $canwrite = $this->Users->userData['default_write'];
        }

        $name = filter_var($name, FILTER_SANITIZE_STRING);
        $body = Filter::body($body);

        $sql = 'INSERT INTO experiments_templates(team, name, body, userid, canread, canwrite) VALUES(:team, :name, :body, :userid, :canread, :canwrite)';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':team', $team, PDO::PARAM_INT);
        $req->bindParam(':name', $name);
        $req->bindParam('body', $body);
        $req->bindParam('userid', $userid, PDO::PARAM_INT);
        $req->bindParam('canread', $canread, PDO::PARAM_STR);
        $req->bindParam('canwrite', $canwrite, PDO::PARAM_STR);
        $this->Db->execute($req);
    }

    /**
     * Create a default template for a new team
     *
     * @param int $team the id of the new team
     * @return void
     */
    public function createDefault(int $team): void
    {
        $defaultBody = "<h1><span style='font-size: 14pt;'>Goal :</span></h1>
            <p>&nbsp;</p>
            <h1><span style='font-size: 14pt;'>Procedure :</span></h1>
            <p>&nbsp;</p>
            <h1><span style='font-size: 14pt;'>Results :<br /></span></h1>
            <p>&nbsp;</p>";

        $this->createNew('default', $defaultBody, 0, $team);
    }

    /**
     * Duplicate a template from someone else in the team
     *
     * @return int id of the new template
     */
    public function duplicate(): int
    {
        $template = $this->read();

        $sql = 'INSERT INTO experiments_templates(team, name, body, userid) VALUES(:team, :name, :body, :userid)';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':team', $this->Users->userData['team'], PDO::PARAM_INT);
        $req->bindParam(':name', $template['name']);
        $req->bindParam(':body', $template['body']);
        $req->bindParam(':userid', $this->Users->userData['userid'], PDO::PARAM_INT);
        $this->Db->execute($req);
        $newId = $this->Db->lastInsertId();

        // copy tags
        $Tags = new Tags($this);
        $Tags->copyTags($newId);

        // copy links and steps too
        $Links = new Links($this);
        $Steps = new Steps($this);
        $Links->duplicate((int) $template['id'], $newId, true);
        $Steps->duplicate((int) $template['id'], $newId, true);

        return $newId;
    }

    /**
     * Read a template
     *
     * @param bool $getTags
     * @param bool $inTeam
     * @return array
     */
    public function read(bool $getTags = false, bool $inTeam = true): array
    {
        $sql = 'SELECT id, name, body, userid FROM experiments_templates WHERE id = :id AND team = :team';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':id', $this->id, PDO::PARAM_INT);
        $req->bindParam(':team', $this->Users->userData['team'], PDO::PARAM_INT);
        $this->Db->execute($req);

        $res = $req->fetch();
        if ($res === false) {
            throw new ImproperActionException('No template found with this id!');
        }

        return $res;
    }

    /**
     * Read templates for a user
     *
     * @return array
     */
    public function readAll(): array
    {
        $sql = "SELECT experiments_templates.id,
            experiments_templates.body,
            experiments_templates.name,
            GROUP_CONCAT(tags.tag SEPARATOR '|') as tags, GROUP_CONCAT(tags.id) as tags_id
            FROM experiments_templates
            LEFT JOIN tags2entity ON (experiments_templates.id = tags2entity.item_id AND tags2entity.item_type = 'experiments_templates')
            LEFT JOIN tags ON (tags2entity.tag_id = tags.id)
            WHERE experiments_templates.userid = :userid
            GROUP BY experiments_templates.id ORDER BY experiments_templates.ordering ASC";
        $req = $this->Db->prepare($sql);
        $req->bindParam(':userid', $this->Users->userData['userid'], PDO::PARAM_INT);
        $this->Db->execute($req);

        $res = $req->fetchAll();
        if ($res === false) {
            return array();
        }
        return $res;
    }

    /**
     * Read the templates from the team. Don't take into account the userid = 0 (common templates)
     * nor the current user templates
     *
     * @return array
     */
    public function readFromTeam(): array
    {
        $sql = "SELECT experiments_templates.id,
            experiments_templates.body,
            experiments_templates.name,
            CONCAT(users.firstname, ' ', users.lastname) AS fullname,
            GROUP_CONCAT(tags.tag SEPARATOR '|') as tags, GROUP_CONCAT(tags.id) as tags_id
            FROM experiments_templates
            LEFT JOIN tags2entity ON (experiments_templates.id = tags2entity.item_id AND tags2entity.item_type = 'experiments_templates')
            LEFT JOIN tags ON (tags2entity.tag_id = tags.id)
            LEFT JOIN users ON (experiments_templates.userid = users.userid)
            WHERE experiments_templates.userid != 0 AND experiments_templates.userid != :userid
            AND experiments_templates.team = :team
            GROUP BY experiments_templates.id ORDER BY experiments_templates.ordering ASC";
        $req = $this->Db->prepare($sql);
        $req->bindParam(':userid', $this->Users->userData['userid'], PDO::PARAM_INT);
        $req->bindParam(':team', $this->Users->userData['team'], PDO::PARAM_INT);
        $this->Db->execute($req);


        $res = $req->fetchAll();
        if ($res === false) {
            return array();
        }

        return $res;
    }

    /*
     * Read all the templates in the experiment_templates table including the currentuser
     *  and default template ( userid = 0 )
     */
    public function readInclusive(): array
    {
        if (!$this->Users->userData['show_team_template']) {
            $this->addFilter('experiments_templates.userid', $this->Users->userData['userid']);
        }

        $sql = "SELECT DISTINCT experiments_templates.*,
                GROUP_CONCAT(DISTINCT steps_t.body SEPARATOR '|') as steps,
                GROUP_CONCAT(DISTINCT link_id SEPARATOR '|') as links,
                CONCAT(users.firstname, ' ', users.lastname) AS fullname,
                GROUP_CONCAT(DISTINCT tags.tag ORDER BY tags.id SEPARATOR '|') as tags,
                GROUP_CONCAT(DISTINCT tags.id) as tags_id,
                users.show_team_template
                FROM experiments_templates
                LEFT JOIN users ON (experiments_templates.userid = users.userid)
                LEFT JOIN ( SELECT item_id AS id,body
                                FROM experiments_templates_steps) AS steps_t
                ON ( experiments_templates.id = steps_t.id)
                LEFT JOIN ( SELECT item_id AS id, link_id
                                FROM experiments_templates_links) AS links_t
                ON ( experiments_templates.id = links_t.id)
                LEFT JOIN tags2entity ON (experiments_templates.id = tags2entity.item_id AND tags2entity.item_type = 'experiments_templates')
                LEFT JOIN tags ON (tags2entity.tag_id = tags.id)
                WHERE 1=1 ";

        foreach ($this->filters as $filter) {
            $sql .= sprintf(" AND %s = '%s'", $filter['column'], $filter['value']);
        }

        $sql .= "GROUP BY id ORDER BY experiments_templates.id ASC , steps ASC";

        $req = $this->Db->prepare($sql);
        $this->Db->execute($req);


        $res = $req->fetchAll();
        if ($res === false) {
            return array();
        }

        // loop the array and only add the ones we can read to return to template
        $finalArr = array();
        foreach ($res as $item) {
            $permissions = $this->getPermissions($item);
            if ($permissions['read']) {
                $item['isWritable'] = $permissions['write'];
                $finalArr[] = $item;
            }
        }

        return $finalArr;
    }

    /**
     * Get the body of the default experiment template
     *
     * @return string body of the common template
     */
    public function readCommonBody(): string
    {
        // don't load the common template if you are using markdown because it's probably in html
        if ($this->Users->userData['use_markdown']) {
            return '';
        }

        $sql = 'SELECT body FROM experiments_templates WHERE userid = 0 AND team = :team LIMIT 1';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':team', $this->Users->userData['team'], PDO::PARAM_INT);
        $this->Db->execute($req);

        $res = $req->fetchColumn();
        if ($res === false || $res === null) {
            return '';
        }
        return $res;
    }

    /**
     * Update the common team template from admin.php
     *
     * @param string $body Content of the template
     * @return void
     */
    public function updateCommon(string $body): void
    {
        $body = Filter::body($body);
        $sql = "UPDATE experiments_templates SET
            name = 'default',
            team = :team,
            body = :body
            WHERE userid = 0 AND team = :team";
        $req = $this->Db->prepare($sql);
        $req->bindParam(':team', $this->Users->userData['team'], PDO::PARAM_INT);
        $req->bindParam(':body', $body);
        $this->Db->execute($req);
    }

    /**
     * Update a template
     *
     * @param int $id Id of the template
     * @param string $name Title of the template
     * @param string $body Content of the template
     * @return void
     */
    public function updateTpl(int $id, string $name, string $body): void
    {
        $body = Filter::body($body);
        $name = Filter::title($name);
        $this->setId($id);

        $sql = 'UPDATE experiments_templates SET
            name = :name,
            body = :body
            WHERE userid = :userid AND id = :id';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':name', $name);
        $req->bindParam(':body', $body);
        $req->bindParam(':userid', $this->Users->userData['userid'], PDO::PARAM_INT);
        $req->bindParam(':id', $this->id, PDO::PARAM_INT);
        $this->Db->execute($req);
    }

    /**
     * Delete template
     *
     * @return void
     */
    public function destroy(): void
    {
        $sql = 'DELETE FROM experiments_templates WHERE id = :id AND userid = :userid';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':id', $this->id, PDO::PARAM_INT);
        $req->bindParam(':userid', $this->Users->userData['userid'], PDO::PARAM_INT);
        $this->Db->execute($req);

        $this->Tags->destroyAll();
    }
}
