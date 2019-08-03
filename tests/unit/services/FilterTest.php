<?php declare(strict_types=1);
/**
 * @author Nicolas CARPi <nicolas.carpi@curie.fr>
 * @copyright 2012 Nicolas CARPi
 * @see https://www.elabftw.net Official website
 * @license AGPL-3.0
 * @package elabftw
 */

namespace Elabftw\Services;

class FilterTest extends \PHPUnit\Framework\TestCase
{
    public function testKdate()
    {
        $this->assertEquals('19690721', Filter::kdate('19690721'));
        $this->assertEquals(date('Ymd'), Filter::kdate('3902348923'));
        $this->assertEquals(date('Ymd'), Filter::kdate('Sun is shining'));
    }

    public function testTitle()
    {
        $this->assertEquals('My super title', Filter::title('My super title'));
        $this->assertEquals('Yep ', Filter::title("Yep\n"));
        $this->assertEquals('Untitled', Filter::title(''));
    }

    public function testBody()
    {
        $this->assertEquals('my body', Filter::body('my body'));
        $this->assertEquals('my body', Filter::body('my body<script></script>'));
    }
}
