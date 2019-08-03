<?php declare(strict_types=1);
/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */

namespace Elabftw\Services;

use Elabftw\Exceptions\ImproperActionException;

class CheckTest extends \PHPUnit\Framework\TestCase
{
    public function testPasswordLength()
    {
        $this->assertTrue(Check::passwordLength('longpassword'));
        $this->expectException(ImproperActionException::class);
        Check::passwordLength('short');
    }

    public function testId()
    {
        $this->expectException(\TypeError::class);
        $this->assertFalse(Check::id('yep'));
        $this->assertFalse(Check::id(-42));
        $this->assertFalse(Check::id(0));
        $this->assertFalse(Check::id(3.1415926535));
        $this->assertEquals(42, Check::id(42));
    }
}