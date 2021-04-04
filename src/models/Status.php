<?php
/**
 * @author Nicolas CARPi <nico-git@deltablot.email>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */
declare(strict_types=1);

namespace Elabftw\Models;

use Elabftw\Elabftw\CreateStatus;
use Elabftw\Elabftw\Db;
use Elabftw\Exceptions\ImproperActionException;
use Elabftw\Interfaces\CreateStatusParamsInterface;
use Elabftw\Interfaces\DestroyParamsInterface;
use Elabftw\Interfaces\UpdateStatusParamsInterface;
use PDO;

/**
 * Things related to status in admin panel
 */
class Status extends AbstractCategory
{
    public function __construct(int $team)
    {
        $this->team = $team;
        $this->Db = Db::getConnection();
    }

    public function create(CreateStatusParamsInterface $params): int
    {
        $sql = 'INSERT INTO status(name, color, team, is_timestampable, is_default)
            VALUES(:name, :color, :team, :is_timestampable, :is_default)';
        $req = $this->Db->prepare($sql);
        $req->bindValue(':name', $params->getContent(), PDO::PARAM_STR);
        $req->bindValue(':color', $params->getColor(), PDO::PARAM_STR);
        $req->bindParam(':team', $this->team, PDO::PARAM_INT);
        $req->bindValue(':is_timestampable', $params->getIsTimestampable(), PDO::PARAM_INT);
        $req->bindValue(':is_default', $params->getIsDefault(), PDO::PARAM_INT);
        $this->Db->execute($req);

        return $this->Db->lastInsertId();
    }

    /**
     * Create a default set of status for a new team
     */
    public function createDefault(): bool
    {
        return $this->create(
            new CreateStatus('Running', '#29AEB9', false, true)
        ) && $this->create(
            new CreateStatus('Success', '#54AA08', true)
        ) && $this->create(
            new CreateStatus('Need to be redone', '#C0C0C0', true)
        ) && $this->create(
            new CreateStatus('Fail', '#C24F3D', true)
        );
    }

    public function readAll(): array
    {
        return $this->read();
    }

    /**
     * SQL to get all status from team
     *
     * @return array All status from the team
     */
    public function read(): array
    {
        $sql = 'SELECT status.id AS category_id,
            status.name AS category,
            status.color,
            status.is_timestampable,
            status.is_default
            FROM status WHERE team = :team ORDER BY ordering ASC';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':team', $this->team, PDO::PARAM_INT);
        $this->Db->execute($req);

        $res = $req->fetchAll();
        if ($res === false) {
            return array();
        }
        return $res;
    }

    /**
     * Get the color of a status
     *
     * @param int $id ID of the category
     * @return string
     */
    public function readColor(int $id): string
    {
        $sql = 'SELECT color FROM status WHERE id = :id';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':id', $id, PDO::PARAM_INT);
        $this->Db->execute($req);

        $res = $req->fetchColumn();
        if ($res === false || $res === null) {
            return '00FF00';
        }
        return (string) $res;
    }

    /**
     * Update a status
     */
    public function update(UpdateStatusParamsInterface $params): bool
    {
        // make sure there is only one default status
        if ($params->getIsDefault() === 1) {
            $this->setDefaultFalse();
        }

        $sql = 'UPDATE status SET
            name = :name,
            color = :color,
            is_timestampable = :is_timestampable,
            is_default = :is_default
            WHERE id = :id AND team = :team';

        $req = $this->Db->prepare($sql);
        $req->bindValue(':name', $params->getContent(), PDO::PARAM_STR);
        $req->bindValue(':color', $params->getColor(), PDO::PARAM_STR);
        $req->bindValue(':is_timestampable', $params->getIsTimestampable(), PDO::PARAM_INT);
        $req->bindValue(':is_default', $params->getIsDefault(), PDO::PARAM_INT);
        $req->bindValue(':id', $params->getId(), PDO::PARAM_INT);
        $req->bindParam(':team', $this->team, PDO::PARAM_INT);
        return $this->Db->execute($req);
    }

    public function destroy(DestroyParamsInterface $params): bool
    {
        // don't allow deletion of a status with experiments
        if ($this->countItems($params->getId()) > 0) {
            throw new ImproperActionException(_('Remove all experiments with this status before deleting this status.'));
        }

        $sql = 'DELETE FROM status WHERE id = :id AND team = :team';
        $req = $this->Db->prepare($sql);
        $req->bindValue(':id', $params->getId(), PDO::PARAM_INT);
        $req->bindParam(':team', $this->team, PDO::PARAM_INT);

        return $this->Db->execute($req);
    }

    /**
     * Count all experiments with this status
     */
    protected function countItems(int $id): int
    {
        $sql = 'SELECT COUNT(*) FROM experiments WHERE category = :category';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':category', $id, PDO::PARAM_INT);
        $this->Db->execute($req);

        return (int) $req->fetchColumn();
    }

    /**
     * Remove all the default status for a team.
     * If we set true to is_default somewhere, it's best to remove all other default
     * in the team so we won't have two default status
     */
    private function setDefaultFalse(): void
    {
        $sql = 'UPDATE status SET is_default = 0 WHERE team = :team';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':team', $this->team, PDO::PARAM_INT);
        $this->Db->execute($req);
    }
}
