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

use Elabftw\Elabftw\Db;
use Elabftw\Exceptions\ImproperActionException;
use Elabftw\Interfaces\DestroyableInterface;
use Elabftw\Traits\SetIdTrait;
use PDO;

/**
 * Store information about different identity providers for auth with SAML
 */
class Idps implements DestroyableInterface
{
    use SetIdTrait;

    protected Db $Db;

    public function __construct(?int $id = null)
    {
        $this->Db = Db::getConnection();
        $this->id = $id;
    }

    /**
     * Create an IDP
     *
     * @param string $ssoUrl Single Sign On URL
     * @param string $sloUrl Single Log Out URL
     * @param string $x509 Public x509 Certificate
     * @param string $active 0 or 1
     *
     * @return int last insert id
     */
    public function create(string $name, string $entityid, string $ssoUrl, string $ssoBinding, string $sloUrl, string $sloBinding, string $x509, string $active): int
    {
        $sql = 'INSERT INTO idps(name, entityid, sso_url, sso_binding, slo_url, slo_binding, x509, active)
            VALUES(:name, :entityid, :sso_url, :sso_binding, :slo_url, :slo_binding, :x509, :active)';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':name', $name);
        $req->bindParam(':entityid', $entityid);
        $req->bindParam(':sso_url', $ssoUrl);
        $req->bindParam(':sso_binding', $ssoBinding);
        $req->bindParam(':slo_url', $sloUrl);
        $req->bindParam(':slo_binding', $sloBinding);
        $req->bindParam(':x509', $x509);
        $req->bindParam(':active', $active);
        $this->Db->execute($req);

        return $this->Db->lastInsertId();
    }

    /**
     * Read all IDPs
     */
    public function readAll(): array
    {
        $sql = 'SELECT * FROM idps';
        $req = $this->Db->prepare($sql);
        $this->Db->execute($req);

        $res = $req->fetchAll();
        if ($res === false) {
            return array();
        }
        return $res;
    }

    /**
     * Update info about an IDP
     *
     * @param string $ssoUrl Single Sign On URL
     * @param string $sloUrl Single Log Out URL
     * @param string $x509 Public x509 Certificate
     * @param string $active 0 or 1
     */
    public function update(int $id, string $name, string $entityid, string $ssoUrl, string $ssoBinding, string $sloUrl, string $sloBinding, string $x509, string $active): void
    {
        $sql = 'UPDATE idps SET
            name = :name,
            entityid = :entityid,
            sso_url = :sso_url,
            sso_binding = :sso_binding,
            slo_url = :slo_url,
            slo_binding = :slo_binding,
            x509 = :x509,
            active = :active
            WHERE id = :id';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':id', $id, PDO::PARAM_INT);
        $req->bindParam(':name', $name);
        $req->bindParam(':entityid', $entityid);
        $req->bindParam(':sso_url', $ssoUrl);
        $req->bindParam(':sso_binding', $ssoBinding);
        $req->bindParam(':slo_url', $sloUrl);
        $req->bindParam(':slo_binding', $sloBinding);
        $req->bindParam(':x509', $x509);
        $req->bindParam(':active', $active);
        $this->Db->execute($req);
    }

    /**
     * Get an active IDP
     */
    public function getActive(?int $id = null): array
    {
        $sql = 'SELECT * FROM idps WHERE active = 1';
        if ($id !== null) {
            $sql .= ' AND id = :id';
        }
        $req = $this->Db->prepare($sql);
        if ($id !== null) {
            $req->bindParam(':id', $id, PDO::PARAM_INT);
        }
        $this->Db->execute($req);

        $res = $req->fetch();
        if ($res === false) {
            throw new ImproperActionException('Could not find active IDP!');
        }
        return $res;
    }

    public function destroy(): bool
    {
        $sql = 'DELETE FROM idps WHERE id = :id';
        $req = $this->Db->prepare($sql);
        $req->bindParam(':id', $this->id, PDO::PARAM_INT);

        return $this->Db->execute($req);
    }
}
